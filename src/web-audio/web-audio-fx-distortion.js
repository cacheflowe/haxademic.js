/**
 * WebAudioFxDistortion — WaveShaperNode with dry/wet control.
 *
 * Uses a soft-clipping curve. amount 0 = clean pass-through, 1 = heavy clip.
 * The curve is regenerated whenever `amount` is set.
 *
 * Usage:
 *   const dist = new WebAudioFxDistortion(ctx, { amount: 0.5, wet: 0.8 });
 *   synth.connect(dist);
 *   dist.connect(ctx.destination);
 *   dist.amount = 0.8; // update at any time
 */
export default class WebAudioFxDistortion {
  constructor(ctx, options = {}) {
    this.ctx = ctx;

    this._in = ctx.createGain();
    this._out = ctx.createGain();
    this._dry = ctx.createGain();
    this._wetGain = ctx.createGain();
    this._shaper = ctx.createWaveShaper();
    this._shaper.oversample = "4x";

    // in → dry → out
    // in → shaper → wetGain → out
    this._in.connect(this._dry);
    this._in.connect(this._shaper);
    this._shaper.connect(this._wetGain);
    this._dry.connect(this._out);
    this._wetGain.connect(this._out);

    this._dry.gain.value = 1;
    this.amount = options.amount ?? 0;
    this.wet = options.wet ?? 0;
  }

  _buildCurve(amount) {
    const n = 512;
    const curve = new Float32Array(n);
    const k = amount * 200;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      // Soft clipping via arctangent-style formula
      curve[i] = k > 0 ? ((Math.PI + k) * x) / (Math.PI + k * Math.abs(x)) : x;
    }
    return curve;
  }

  get amount() {
    return this._amount;
  }
  set amount(v) {
    this._amount = Math.max(0, Math.min(1, v));
    this._shaper.curve = this._buildCurve(this._amount);
  }

  get wet() {
    return this._wetGain.gain.value;
  }
  set wet(v) {
    this._wetGain.gain.value = Math.max(0, Math.min(1, v));
  }

  get input() {
    return this._in;
  }

  connect(node) {
    this._out.connect(node.input ?? node);
    return this;
  }
}
