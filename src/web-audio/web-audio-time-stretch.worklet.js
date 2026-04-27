/**
 * TimeStretchProcessor — granular overlap-add time-stretching and pitch-shifting.
 *
 * Runs on the audio thread as an AudioWorkletProcessor.
 * Receives buffer data via port.postMessage, outputs time-stretched audio
 * with independent pitch and speed control.
 *
 * Algorithm: overlapping Hanning-windowed grains with per-grain resampling.
 * - timeStretch controls how fast the read pointer advances (speed without pitch)
 * - pitchShift controls the playback rate within each grain (pitch without speed)
 *
 * Message protocol (main thread → processor):
 *   { type: 'setBuffer', channels: Float32Array[] }
 *   { type: 'seek', offset: 0..1 }
 *   { type: 'play' } / { type: 'stop' }
 *   { type: 'loop', value: boolean }
 *
 * Message protocol (processor → main thread):
 *   { type: 'ended' }
 */

const HANNING_TABLE_SIZE = 4096;
const MAX_GRAINS = 8;

class TimeStretchProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: "timeStretch", defaultValue: 1.0, minValue: 0.25, maxValue: 4.0, automationRate: "k-rate" },
      { name: "pitchShift", defaultValue: 0, minValue: -24, maxValue: 24, automationRate: "k-rate" },
      { name: "grainSize", defaultValue: 0.06, minValue: 0.02, maxValue: 0.15, automationRate: "k-rate" },
    ];
  }

  constructor(options) {
    super();

    this._sampleRate = options.processorOptions?.sampleRate || 44100;
    this._buffers = null; // Float32Array[] — one per channel
    this._bufferLength = 0;
    this._readPointer = 0; // floating-point position in source buffer (samples)
    this._playing = false;
    this._loop = true;

    // Grain pool — fixed-size array, no allocation during process()
    this._grains = new Array(MAX_GRAINS);
    for (let i = 0; i < MAX_GRAINS; i++) {
      this._grains[i] = { active: false, bufferStart: 0, localPos: 0, length: 0, pitchRatio: 1 };
    }
    this._activeGrainCount = 0;

    // Grain scheduling
    this._outputSampleCount = 0;
    this._nextGrainTime = 0;

    // Pre-compute Hanning window table
    this._hanningTable = new Float32Array(HANNING_TABLE_SIZE);
    for (let i = 0; i < HANNING_TABLE_SIZE; i++) {
      this._hanningTable[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (HANNING_TABLE_SIZE - 1)));
    }

    // Message handling
    this.port.onmessage = (e) => {
      const msg = e.data;
      switch (msg.type) {
        case "setBuffer":
          this._buffers = msg.channels;
          this._bufferLength = msg.channels[0].length;
          this._readPointer = 0;
          this._activeGrainCount = 0;
          this._nextGrainTime = 0;
          this._outputSampleCount = 0;
          break;
        case "seek":
          this._readPointer = msg.offset * this._bufferLength;
          this._activeGrainCount = 0; // clear all grains
          this._nextGrainTime = this._outputSampleCount; // spawn grain immediately
          break;
        case "play":
          this._playing = true;
          break;
        case "stop":
          this._playing = false;
          this._activeGrainCount = 0;
          break;
        case "loop":
          this._loop = msg.value;
          break;
      }
    };
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    if (!output || !output[0]) return true;

    const blockSize = output[0].length;

    if (!this._playing || !this._buffers) {
      // Output silence
      for (let ch = 0; ch < output.length; ch++) {
        output[ch].fill(0);
      }
      return true;
    }

    const timeStretch = parameters.timeStretch[0];
    const pitchShift = parameters.pitchShift[0];
    const grainSizeSec = parameters.grainSize[0];

    const grainSizeSamples = Math.round(grainSizeSec * this._sampleRate);
    const pitchRatio = Math.pow(2, pitchShift / 12);
    const hopSizeSamples = Math.round(grainSizeSamples * 0.5); // 50% overlap
    const numChannels = this._buffers.length;
    const bufLen = this._bufferLength;

    for (let i = 0; i < blockSize; i++) {
      // ---- Schedule new grains ----
      if (this._outputSampleCount >= this._nextGrainTime) {
        if (this._activeGrainCount < MAX_GRAINS) {
          const grain = this._grains[this._activeGrainCount];
          grain.active = true;
          grain.bufferStart = this._readPointer;
          grain.localPos = 0;
          grain.length = grainSizeSamples;
          grain.pitchRatio = pitchRatio;
          this._activeGrainCount++;
        }
        this._nextGrainTime = this._outputSampleCount + hopSizeSamples;

        // Advance read pointer by hop * timeStretch
        this._readPointer += hopSizeSamples * timeStretch;

        // Handle looping / end
        if (this._loop) {
          while (this._readPointer >= bufLen) this._readPointer -= bufLen;
          while (this._readPointer < 0) this._readPointer += bufLen;
        } else if (this._readPointer >= bufLen) {
          this._playing = false;
          this.port.postMessage({ type: "ended" });
          // Fill remaining output with silence
          for (let ch = 0; ch < output.length; ch++) {
            for (let j = i; j < blockSize; j++) output[ch][j] = 0;
          }
          return true;
        }
      }

      // ---- Render active grains ----
      let sampleL = 0;
      let sampleR = 0;

      for (let g = this._activeGrainCount - 1; g >= 0; g--) {
        const grain = this._grains[g];

        // Hanning window lookup
        const windowPhase = grain.localPos / grain.length; // 0..1
        const tableIndex = (windowPhase * (HANNING_TABLE_SIZE - 1)) | 0;
        const window = this._hanningTable[tableIndex];

        // Source buffer read position (with pitch resampling)
        const srcPos = grain.bufferStart + grain.localPos * grain.pitchRatio;

        // Wrap to buffer bounds (positive modulo)
        let srcIndex = srcPos % bufLen;
        if (srcIndex < 0) srcIndex += bufLen;

        // Linear interpolation
        const idx0 = srcIndex | 0; // floor via bitwise OR
        const idx1 = (idx0 + 1) % bufLen;
        const frac = srcIndex - idx0;

        sampleL += window * (this._buffers[0][idx0] * (1 - frac) + this._buffers[0][idx1] * frac);
        if (numChannels > 1) {
          sampleR += window * (this._buffers[1][idx0] * (1 - frac) + this._buffers[1][idx1] * frac);
        }

        // Advance grain, retire if done
        grain.localPos++;
        if (grain.localPos >= grain.length) {
          // Swap-and-decrement: move last active grain into this slot
          grain.active = false;
          this._activeGrainCount--;
          if (g < this._activeGrainCount) {
            const last = this._grains[this._activeGrainCount];
            this._grains[g] = last;
            this._grains[this._activeGrainCount] = grain;
          }
        }
      }

      output[0][i] = sampleL;
      if (output.length > 1) {
        output[1][i] = numChannels > 1 ? sampleR : sampleL;
      }

      this._outputSampleCount++;
    }

    return true;
  }
}

registerProcessor("time-stretch-processor", TimeStretchProcessor);
