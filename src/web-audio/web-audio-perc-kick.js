/**
 * WebAudioPercKick — 808-style kick via sine oscillator with pitch sweep.
 *
 * A sine starts at a high frequency and rapidly drops to a low thump,
 * while the amplitude decays. Adjust startFreq/endFreq/sweepTime/decay
 * for different flavors (punchy, boomy, snappy).
 *
 * Usage:
 *   const kick = new WebAudioPercKick(ctx);
 *   kick.connect(ctx.destination);
 *   kick.trigger(0.9, time);
 */
export default class WebAudioPercKick {
  constructor(ctx, options = {}) {
    this.ctx = ctx;
    this.startFreq = options.startFreq ?? 150; // Hz — the initial click transient
    this.endFreq = options.endFreq ?? 40; // Hz — low body tone
    this.sweepTime = options.sweepTime ?? 0.08; // seconds for pitch to fall
    this.decay = options.decay ?? 0.35; // total amplitude decay time

    this._out = ctx.createGain();
    this._out.gain.value = options.volume ?? 1;
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

    const osc = ctx.createOscillator();
    const amp = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(this.startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, this.endFreq), t + this.sweepTime);

    amp.gain.setValueAtTime(velocity, t);
    amp.gain.exponentialRampToValueAtTime(0.001, t + this.decay);

    osc.connect(amp);
    amp.connect(this._out);

    osc.start(t);
    osc.stop(t + this.decay + 0.05);

    return this;
  }
}
