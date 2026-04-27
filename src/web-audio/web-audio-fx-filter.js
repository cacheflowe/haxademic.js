/**
 * WebAudioFxFilter — combined highpass + lowpass filter with shared Q.
 *
 * Audio chain:  in → HPF → LPF → out
 *
 * Always inline (no dry/wet) — acts as a DJ-style sweep filter on the
 * master output of an FX chain.
 *
 * Usage:
 *   const filter = new WebAudioFxFilter(ctx, { lpFreq: 8000, hpFreq: 80 });
 *   fxBus.connect(filter);
 *   filter.connect(ctx.destination);
 *   filter.lpFreq = 2000; // darken
 *   filter.hpFreq = 400;  // thin out bass
 */
export default class WebAudioFxFilter {
  constructor(ctx, options = {}) {
    this._hp = ctx.createBiquadFilter();
    this._hp.type = "highpass";
    this._hp.frequency.value = options.hpFreq ?? 20;
    this._hp.Q.value = options.q ?? 0.7;

    this._lp = ctx.createBiquadFilter();
    this._lp.type = "lowpass";
    this._lp.frequency.value = options.lpFreq ?? 20000;
    this._lp.Q.value = options.q ?? 0.7;

    // in → hp → lp → out
    this._hp.connect(this._lp);
  }

  get lpFreq() {
    return this._lp.frequency.value;
  }
  set lpFreq(v) {
    this._lp.frequency.value = v;
  }

  get hpFreq() {
    return this._hp.frequency.value;
  }
  set hpFreq(v) {
    this._hp.frequency.value = v;
  }

  get q() {
    return this._lp.Q.value;
  }
  set q(v) {
    this._lp.Q.value = v;
    this._hp.Q.value = v;
  }

  get input() {
    return this._hp;
  }

  connect(node) {
    this._lp.connect(node.input ?? node);
    return this;
  }
}
