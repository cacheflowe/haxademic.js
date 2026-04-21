/**
 * WebAudioBreakPlayer — loads a drum loop, time-stretches it to the target
 * BPM, and plays it continuously with optional random playhead jumps that
 * snap to musical subdivisions and automatically return to the nominal
 * (on-track) position after a set number of steps.
 *
 * playbackRate = (targetBpm / originalBpm) * speedMultiplier
 *
 * Call trigger() on every sequencer step — the player handles loop-boundary
 * restarts internally. On a random jump the playhead seeks to one of
 * `subdivision` equally-spaced on-beat positions in the buffer, then returns
 * to the nominal position after `returnSteps` steps. The buffer is never
 * force-stopped mid-play; it runs until its natural end and restarts from the
 * correct nominal offset on the next step.
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
    this._sourceOffset = 0;
    this._sourceStartTime = 0;
    this._sourcePlaybackRate = 1;
    this._sourceReverse = false;
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
   * Call on every sequencer step. The player decides whether to start,
   * continue, jump, or return based on the step position and random chance.
   *
   * @param {number} globalStep  Absolute step count (resets to 0 on play).
   * @param {number} bpm         Current tempo in BPM.
   * @param {number} atTime      AudioContext scheduled time for this step.
   */
  trigger(globalStep, bpm, atTime) {
    if (!this._buffer) return;

    const playbackRate = (bpm / this._originalBpm) * this.speedMultiplier;
    const loopSteps = Math.max(1, Math.round((this._bars * 16) / this.speedMultiplier));

    // Nominal buffer offset — where we should be in the loop at this step
    const nominalOffset = ((globalStep % loopSteps) / loopSteps) * this._buffer.duration;

    // Has the current source naturally played to the end by atTime?
    const sourceEndTime =
      this._sourceStartTime + (this._buffer.duration - this._sourceOffset) / this._sourcePlaybackRate;
    const sourceEnded = !this._source || sourceEndTime <= atTime + 0.001;

    // Loop boundary or source ended — restart from nominal (forward)
    if (globalStep % loopSteps === 0 || sourceEnded) {
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
    source.connect(this._out);
    source.start(atTime, offset);
    this._source = source;
    this._sourceOffset = offset;
    this._sourceStartTime = atTime;
    this._sourcePlaybackRate = playbackRate;
    this._sourceReverse = reverse;
    source.onended = () => {
      if (this._source === source) this._source = null;
      source.disconnect();
    };
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
