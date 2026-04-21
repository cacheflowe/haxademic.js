/**
 * WebAudioPercHihat — bandpass-filtered white noise with fast amplitude decay.
 *
 * A pre-generated noise buffer is reused across all triggers for efficiency.
 * Adjust filterFreq/filterQ for open vs closed character, decay for length.
 *
 * Usage:
 *   const hihat = new WebAudioPercHihat(ctx, { decay: 0.04 }); // tight closed hat
 *   hihat.connect(ctx.destination);
 *   hihat.trigger(0.6, time);
 */
export default class WebAudioPercHihat {
  constructor(ctx, options = {}) {
    this.ctx = ctx;
    this.filterFreq = options.filterFreq ?? 8000; // Hz — center of bandpass
    this.filterQ = options.filterQ ?? 0.8;
    this.decay = options.decay ?? 0.06; // seconds

    this._noiseBuffer = this._buildNoiseBuffer();
    this._out = ctx.createGain();
    this._out.gain.value = options.volume ?? 1;
  }

  _buildNoiseBuffer() {
    const ctx = this.ctx;
    // Half-second of mono white noise, reused across all triggers
    const length = Math.floor(ctx.sampleRate * 0.5);
    const buf = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  get input() {
    return this._out;
  }

  connect(node) {
    this._out.connect(node.input ?? node);
    return this;
  }

  /**
   * @param {number} [velocity]  0–1
   * @param {number} [atTime]    AudioContext time
   */
  trigger(velocity = 1, atTime = 0) {
    const ctx = this.ctx;
    const t = atTime > 0 ? atTime : ctx.currentTime;

    const noise = ctx.createBufferSource();
    noise.buffer = this._noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = this.filterFreq;
    filter.Q.value = this.filterQ;

    const amp = ctx.createGain();
    amp.gain.setValueAtTime(velocity, t);
    amp.gain.exponentialRampToValueAtTime(0.001, t + this.decay);

    noise.connect(filter);
    filter.connect(amp);
    amp.connect(this._out);

    noise.start(t);
    noise.stop(t + this.decay + 0.05);

    return this;
  }
}
