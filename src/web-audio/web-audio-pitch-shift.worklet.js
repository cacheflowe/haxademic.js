/**
 * PitchShiftProcessor — real-time granular pitch-shifting EFFECT.
 *
 * This is an AudioWorkletProcessor that processes live audio input — it is NOT
 * an audio source. It sits in the signal chain between a source node (e.g.
 * BufferSourceNode) and the output. This is a deliberate architectural choice:
 * BufferSourceNode provides sample-accurate start(atTime, offset) scheduling,
 * which is essential for beat-synced playback with jumps/reverses. A worklet-
 * as-source approach (via postMessage seek/play) has ~3-6ms jitter that breaks
 * musical timing. By keeping the worklet as an effect, all transport timing
 * stays sample-accurate.
 *
 * Algorithm: circular buffer with two overlapping Hanning-windowed read taps.
 * Input samples are written sequentially into the circular buffer. Two read
 * taps advance through the buffer at `pitchRatio` speed (derived from the
 * pitchShift semitone parameter). The taps are offset by half the grain size
 * so their Hanning windows sum to ~1.0 at all points, producing smooth
 * overlap-add output. When a tap finishes its grain, it resets to read from
 * near the current write position, maintaining low latency.
 *
 * Grain size is configurable via AudioParam (128–4096 samples). Small grains
 * (~512, "clean") produce transparent pitch shifting. Large grains (~2048,
 * "vintage") produce audible repetition/stutter artifacts characteristic of
 * classic hardware timestretchers (Akai S-series, early Ableton).
 *
 * Bypass: when pitchShift === 0, input is copied directly to output with zero
 * latency. The circular buffer is still filled so switching to non-zero pitch
 * mid-playback is seamless.
 *
 * Used by: WebAudioPitchShift (main-thread wrapper) → WebAudioBreakPlayer
 *
 * AudioParams:
 *   pitchShift  — semitones (-24 to +24), k-rate
 *   grainSize   — samples (128 to 4096, default 512), k-rate
 */

const WINDOW_TABLE_SIZE = 4096;
const BUFFER_SIZE = 8192; // power of 2
const BUFFER_MASK = BUFFER_SIZE - 1;

class PitchShiftProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: "pitchShift",
        defaultValue: 0,
        minValue: -24,
        maxValue: 24,
        automationRate: "k-rate",
      },
      {
        name: "grainSize",
        defaultValue: 512,
        minValue: 128,
        maxValue: 4096,
        automationRate: "k-rate",
      },
    ];
  }

  constructor() {
    super();

    // Circular buffer per channel (up to stereo)
    this._bufL = new Float32Array(BUFFER_SIZE);
    this._bufR = new Float32Array(BUFFER_SIZE);
    this._writePos = 0;

    // Two read taps, offset by half grain for smooth overlap-add
    this._tap0 = { grainStart: 0, localPos: 0, phase: 0 };
    this._tap1 = { grainStart: 0, localPos: 0, phase: 256 }; // half of default 512
    this._prevGrainSize = 512;

    // Pre-compute Hanning window lookup table (large, indexed by normalized phase)
    this._window = new Float32Array(WINDOW_TABLE_SIZE);
    for (let i = 0; i < WINDOW_TABLE_SIZE; i++) {
      this._window[i] =
        0.5 * (1 - Math.cos((2 * Math.PI * i) / (WINDOW_TABLE_SIZE - 1)));
    }
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || !input[0] || !output || !output[0]) return true;

    const inL = input[0];
    const inR = input.length > 1 ? input[1] : null;
    const outL = output[0];
    const outR = output.length > 1 ? output[1] : null;
    const blockSize = inL.length;

    const pitchShift = parameters.pitchShift[0];
    const grainSize = Math.round(parameters.grainSize[0]);

    // Bypass — zero latency pass-through
    if (pitchShift === 0) {
      outL.set(inL);
      if (outR) outR.set(inR || inL);
      // Still fill circular buffer so switching to non-zero is seamless
      for (let i = 0; i < blockSize; i++) {
        this._bufL[this._writePos] = inL[i];
        this._bufR[this._writePos] = inR ? inR[i] : inL[i];
        this._writePos = (this._writePos + 1) & BUFFER_MASK;
      }
      return true;
    }

    // Detect grain size change and re-initialize tap offsets
    if (grainSize !== this._prevGrainSize) {
      const halfGrain = grainSize >>> 1;
      this._tap0.phase = 0;
      this._tap0.localPos = 0;
      this._tap0.grainStart =
        (this._writePos - grainSize + BUFFER_SIZE) & BUFFER_MASK;
      this._tap1.phase = halfGrain;
      this._tap1.localPos = 0;
      this._tap1.grainStart =
        (this._writePos - grainSize + BUFFER_SIZE) & BUFFER_MASK;
      this._prevGrainSize = grainSize;
    }

    const pitchRatio = Math.pow(2, pitchShift / 12);
    const tap0 = this._tap0;
    const tap1 = this._tap1;
    const win = this._window;
    const bufL = this._bufL;
    const bufR = this._bufR;
    const winScale = (WINDOW_TABLE_SIZE - 1) / grainSize;

    for (let i = 0; i < blockSize; i++) {
      // Write input into circular buffer
      bufL[this._writePos] = inL[i];
      bufR[this._writePos] = inR ? inR[i] : inL[i];

      // Read from both taps with windowed overlap-add
      let sL = 0;
      let sR = 0;

      // Tap 0
      const readPos0 =
        (tap0.grainStart + ((tap0.localPos + 0.5) | 0)) & BUFFER_MASK;
      const w0 = win[(tap0.phase * winScale + 0.5) | 0];
      sL += bufL[readPos0] * w0;
      sR += bufR[readPos0] * w0;

      tap0.localPos += pitchRatio;
      tap0.phase++;

      if (tap0.phase >= grainSize) {
        tap0.phase = 0;
        tap0.localPos = 0;
        tap0.grainStart =
          (this._writePos - grainSize + BUFFER_SIZE) & BUFFER_MASK;
      }

      // Tap 1
      const readPos1 =
        (tap1.grainStart + ((tap1.localPos + 0.5) | 0)) & BUFFER_MASK;
      const w1 = win[(tap1.phase * winScale + 0.5) | 0];
      sL += bufL[readPos1] * w1;
      sR += bufR[readPos1] * w1;

      tap1.localPos += pitchRatio;
      tap1.phase++;

      if (tap1.phase >= grainSize) {
        tap1.phase = 0;
        tap1.localPos = 0;
        tap1.grainStart =
          (this._writePos - grainSize + BUFFER_SIZE) & BUFFER_MASK;
      }

      outL[i] = sL;
      if (outR) outR[i] = sR;

      this._writePos = (this._writePos + 1) & BUFFER_MASK;
    }

    return true;
  }
}

registerProcessor("pitch-shift-processor", PitchShiftProcessor);
