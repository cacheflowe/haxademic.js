/**
 * WebAudioBreakPlayer — loads a drum loop, time-stretches it to the target
 * BPM, and plays it continuously with optional random playhead jumps that
 * snap to musical subdivisions and automatically return to the nominal
 * (on-track) position after a set number of steps.
 *
 * playbackRate = (targetBpm / originalBpm) * speedMultiplier
 *
 * Forward playback uses BufferSourceNode loop=true so the Web Audio engine
 * handles the wrap-around at sample precision — no stop/start at the loop
 * boundary, no click. Jumps and BPM changes restart from the nominal offset.
 *
 * Usage:
 *   const brk = new WebAudioBreakPlayer(ctx, { subdivision: 8, returnSteps: 4 });
 *   await brk.load('../data/audio/breaks/0034-break-think.badsister_loop_4_.wav');
 *   brk.connect(ctx.destination);
 *
 *   // In sequencer onStep — call on every step:
 *   brk.trigger(globalStep, bpm, time);
 */
export default class WebAudioBreakPlayer {
  /**
   * @param {AudioContext} ctx
   * @param {object} [options]
   * @param {number} [options.speedMultiplier=1]  Cycles N× faster; pitch shifts accordingly
   * @param {number} [options.subdivision=8]      On-beat jump slots (4, 8, or 16)
   * @param {number} [options.returnSteps=4]      Steps after a jump before returning to nominal
   * @param {number} [options.randomChance=0.1]   0–1 probability of a forward jump per step
   * @param {number} [options.reverseChance=0.04] 0–1 probability of a reverse-playback event per step
   * @param {number} [options.volume=0.8]
   */
  constructor(ctx, options = {}) {
    this.ctx = ctx;
    this.speedMultiplier = options.speedMultiplier ?? 1;
    this.subdivision = options.subdivision ?? 8;
    this.returnSteps = options.returnSteps ?? 4;
    this.randomChance = options.randomChance ?? 0.1;
    this.reverseChance = options.reverseChance ?? 0.04;

    this._buffer = null;
    this._reverseBuffer = null;
    this._bars = 4;
    this._originalBpm = 120;

    this._source = null;
    this._sourcePlaybackRate = 1;
    this._returnAtStep = -1;

    this._out = ctx.createGain();
    this._out.gain.value = options.volume ?? 0.8;
  }

  // ---- Loading ----

  async load(url, bars) {
    this.stop();
    this._buffer = null;
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    this._buffer = await this.ctx.decodeAudioData(arrayBuffer);
    this._bars = bars ?? this._parseBars(url);
    this._originalBpm = (this._bars * 4 * 60) / this._buffer.duration;
    this._reverseBuffer = this._buildReverseBuffer(this._buffer);
    this._returnAtStep = -1;
    return this;
  }

  _parseBars(url) {
    const m = url.match(/_loop_(\d+)_/i);
    return m ? parseInt(m[1]) : 4;
  }

  _buildReverseBuffer(buffer) {
    const reversed = this.ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const src = buffer.getChannelData(ch);
      const dst = reversed.getChannelData(ch);
      for (let i = 0; i < src.length; i++) dst[i] = src[src.length - 1 - i];
    }
    return reversed;
  }

  get loaded() {
    return this._buffer !== null;
  }

  // ---- Routing ----

  get volume() {
    return this._out.gain.value;
  }

  set volume(v) {
    this._out.gain.value = v;
  }

  get input() {
    return this._out;
  }

  connect(node) {
    this._out.connect(node.input ?? node);
    return this;
  }

  // ---- Playback ----

  /**
   * Call on every sequencer step. The looping source runs continuously;
   * this only intervenes for initial start, BPM changes, jumps, and returns.
   *
   * @param {number} globalStep  Absolute step count (resets to 0 on play).
   * @param {number} bpm         Current tempo in BPM.
   * @param {number} atTime      AudioContext scheduled time for this step.
   */
  trigger(globalStep, bpm, atTime) {
    if (!this._buffer) return;

    const playbackRate = (bpm / this._originalBpm) * this.speedMultiplier;
    const loopSteps = Math.max(1, Math.round((this._bars * 16) / this.speedMultiplier));
    const nominalOffset = ((globalStep % loopSteps) / loopSteps) * this._buffer.duration;

    // Initial start or reverse event ended naturally — start looping from nominal
    if (!this._source) {
      this._startSource(nominalOffset, atTime, playbackRate, false);
      this._returnAtStep = -1;
      return;
    }

    // BPM changed — resync to nominal position with new rate
    if (Math.abs(this._sourcePlaybackRate - playbackRate) > 0.0001) {
      this._startSource(nominalOffset, atTime, playbackRate, false);
      this._returnAtStep = -1;
      return;
    }

    // Return from jump or reverse — back to nominal (forward)
    if (this._returnAtStep >= 0 && globalStep >= this._returnAtStep) {
      this._startSource(nominalOffset, atTime, playbackRate, false);
      this._returnAtStep = -1;
      return;
    }

    // Random events — only when not already mid-jump
    if (this._returnAtStep < 0) {
      // Reverse playback (lower probability, checked first)
      if (Math.random() < this.reverseChance) {
        const slot = Math.floor(Math.random() * this.subdivision);
        const jumpOffset = (slot / this.subdivision) * this._buffer.duration;
        this._startSource(jumpOffset, atTime, playbackRate, true);
        this._returnAtStep = globalStep + this.returnSteps;
        return;
      }
      // Forward jump
      if (Math.random() < this.randomChance) {
        const slot = Math.floor(Math.random() * this.subdivision);
        const jumpOffset = (slot / this.subdivision) * this._buffer.duration;
        this._startSource(jumpOffset, atTime, playbackRate, false);
        this._returnAtStep = globalStep + this.returnSteps;
      }
    }
  }

  _startSource(offset, atTime, playbackRate, reverse) {
    if (this._source) {
      try {
        this._source.stop(atTime);
      } catch (e) {
        // already ended
      }
      this._source = null;
    }
    const buf = reverse ? this._reverseBuffer : this._buffer;
    const source = this.ctx.createBufferSource();
    source.buffer = buf;
    source.playbackRate.value = playbackRate;
    // Forward sources loop seamlessly at the sample level — no stop/start glitch
    // Reverse sources play once; trigger() handles the return when they end
    if (!reverse) {
      source.loop = true;
      source.loopStart = 0;
      source.loopEnd = buf.duration;
    }
    source.connect(this._out);
    source.start(atTime, offset);
    this._source = source;
    this._sourcePlaybackRate = playbackRate;
    source.onended = () => {
      if (this._source === source) this._source = null;
      source.disconnect();
    };
  }

  /**
   * Jump immediately to a fixed segment of the buffer (e.g. kick / hat / snare positions).
   * Cancels any pending return-from-jump so the loop continues from this new position.
   *
   * @param {number} segIndex    0-based segment index (0 = start, 1 = 1/3, 2 = 2/3 for numSegments=3)
   * @param {number} numSegments Number of equal segments to divide the buffer into
   * @param {number} bpm         Current tempo
   * @param {number} atTime      Scheduled AudioContext time
   */
  jumpToSegment(segIndex, numSegments, bpm, atTime) {
    if (!this._buffer) return;
    const playbackRate = (bpm / this._originalBpm) * this.speedMultiplier;
    const offset = (segIndex / numSegments) * this._buffer.duration;
    this._startSource(offset, atTime, playbackRate, false);
    this._returnAtStep = -1;
  }

  stop(atTime) {
    if (this._source) {
      try {
        this._source.stop(atTime ?? this.ctx.currentTime);
      } catch (e) {
        // already ended
      }
      this._source = null;
    }
    this._returnAtStep = -1;
  }

  reset() {
    this._returnAtStep = -1;
    this.stop();
  }
}
