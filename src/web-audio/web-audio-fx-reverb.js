/**
 * WebAudioFxReverb — ConvolverNode with a synthesized impulse response.
 *
 * The impulse response is generated synchronously at construction time
 * (no async/await needed, unlike Tone.js Reverb). The dry signal always
 * passes through at full gain; the wet gain controls reverb amount.
 *
 * Usage:
 *   const reverb = new WebAudioFxReverb(ctx, { decay: 3, wet: 0.4 });
 *   synth.connect(reverb);
 *   reverb.connect(ctx.destination);
 *   reverb.wet = 0.6; // update at any time
 */
export default class WebAudioFxReverb {
  constructor(ctx, options = {}) {
    this.ctx = ctx;

    this._in = ctx.createGain();
    this._out = ctx.createGain();
    this._dry = ctx.createGain();
    this._wetGain = ctx.createGain();
    this._convolver = ctx.createConvolver();

    this._convolver.buffer = this._buildImpulse(options.decay ?? 2.5);

    // in → dry → out
    // in → convolver → wetGain → out
    this._in.connect(this._dry);
    this._in.connect(this._convolver);
    this._convolver.connect(this._wetGain);
    this._dry.connect(this._out);
    this._wetGain.connect(this._out);

    this._dry.gain.value = 1; // always full dry
    this.wet = options.wet ?? 0.3;
  }

  _buildImpulse(duration) {
    const ctx = this.ctx;
    const length = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        // Exponential decay envelope on white noise
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    return buf;
  }

  get wet() {
    return this._wetGain.gain.value;
  }
  set wet(v) {
    this._wetGain.gain.value = Math.max(0, Math.min(1, v));
  }

  /** Entry point — upstream sources connect here. */
  get input() {
    return this._in;
  }

  connect(node) {
    this._out.connect(node.input ?? node);
    return this;
  }
}
