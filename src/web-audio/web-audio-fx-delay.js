/**
 * WebAudioFxDelay — feedback delay line with dry/wet control.
 *
 * Usage:
 *   const delay = new WebAudioFxDelay(ctx, { delayTime: 0.25, feedback: 0.3, wet: 0.2 });
 *   synth.connect(delay);
 *   delay.connect(reverb);
 *   delay.wet = 0.4;
 *   delay.feedback = 0.35;
 *   delay.delayTime = 0.375; // tempo-sync: update when BPM changes
 */
export default class WebAudioFxDelay {
  constructor(ctx, options = {}) {
    this.ctx = ctx;

    this._in = ctx.createGain();
    this._out = ctx.createGain();
    this._dry = ctx.createGain();
    this._wetGain = ctx.createGain();
    this._delay = ctx.createDelay(2.0); // 2-second max delay
    this._feedback = ctx.createGain();

    this._delay.delayTime.value = options.delayTime ?? 0.25;
    this._feedback.gain.value = options.feedback ?? 0.3;

    // in → dry → out
    // in → delay → wetGain → out
    //      delay → feedback → delay  (feedback loop)
    this._in.connect(this._dry);
    this._in.connect(this._delay);
    this._delay.connect(this._wetGain);
    this._delay.connect(this._feedback);
    this._feedback.connect(this._delay);
    this._dry.connect(this._out);
    this._wetGain.connect(this._out);

    this._dry.gain.value = 1;
    this.wet = options.wet ?? 0.2;
  }

  get wet() {
    return this._wetGain.gain.value;
  }
  set wet(v) {
    this._wetGain.gain.value = Math.max(0, Math.min(1, v));
  }

  get feedback() {
    return this._feedback.gain.value;
  }
  set feedback(v) {
    this._feedback.gain.value = Math.min(0.95, Math.max(0, v));
  }

  get delayTime() {
    return this._delay.delayTime.value;
  }
  set delayTime(secs) {
    this._delay.delayTime.value = Math.max(0, Math.min(2, secs));
  }

  get input() {
    return this._in;
  }

  connect(node) {
    this._out.connect(node.input ?? node);
    return this;
  }
}
