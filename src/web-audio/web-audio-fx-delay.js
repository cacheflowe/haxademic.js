/**
 * WebAudioFxDelay — dub-style feedback delay with BPM sync, feedback filter,
 * and LFO modulation.
 *
 * Audio chain:
 *   in → delay → wetGain → out
 *        delay → filter (LP) → feedback → delay (loop)
 *   in → dry → out
 *   LFO (0.3 Hz sine) → lfoGain → delay.delayTime
 *
 * Supports two modes:
 *   1. BPM-synced: set `interval` (beats) + `bpm` — delay time auto-computes
 *   2. Direct: set `delayTime` in seconds (for non-sequenced use)
 *
 * Usage (BPM-synced):
 *   const delay = new WebAudioFxDelay(ctx, { interval: 0.75, bpm: 128 });
 *   delay.bpm = 140; // live update
 *
 * Usage (direct):
 *   const delay = new WebAudioFxDelay(ctx, { delayTime: 0.25 });
 */
export default class WebAudioFxDelay {
  static INTERVALS = [
    { label: "1/16", beats: 0.25 },
    { label: "1/8", beats: 0.5 },
    { label: "1/8·", beats: 0.75 },
    { label: "1/4", beats: 1 },
    { label: "1/4·", beats: 1.5 },
    { label: "1/2", beats: 2 },
  ];

  constructor(ctx, options = {}) {
    this.ctx = ctx;

    this._in = ctx.createGain();
    this._out = ctx.createGain();
    this._dry = ctx.createGain();
    this._wetGain = ctx.createGain();
    this._delay = ctx.createDelay(2.0);
    this._filter = ctx.createBiquadFilter();
    this._filter.type = "lowpass";
    this._filter.frequency.value = options.filterFreq ?? 12000;
    this._filter.Q.value = 0.7;
    this._feedback = ctx.createGain();

    this._bpm = options.bpm ?? 120;
    this._interval = options.interval ?? null; // null = direct delayTime mode

    // Set initial delay time
    if (this._interval != null) {
      this._delay.delayTime.value = this._computeDelayTime();
    } else {
      this._delay.delayTime.value = options.delayTime ?? 0.25;
    }

    this._feedback.gain.value = Math.min(0.95, Math.max(0, options.feedback ?? 0.3));

    // in → dry → out
    this._in.connect(this._dry);
    this._dry.connect(this._out);
    this._dry.gain.value = 1;

    // in → delay → wetGain → out
    // delay → filter → feedback → delay (loop)
    this._in.connect(this._delay);
    this._delay.connect(this._wetGain);
    this._delay.connect(this._filter);
    this._filter.connect(this._feedback);
    this._feedback.connect(this._delay);
    this._wetGain.connect(this._out);

    this.wet = options.wet ?? 0.2;

    // LFO modulation on delay time (subtle chorus/wobble on repeats)
    this._lfo = ctx.createOscillator();
    this._lfo.type = "sine";
    this._lfo.frequency.value = 0.3;
    this._lfoGain = ctx.createGain();
    this._lfoGain.gain.value = (options.modulation ?? 0) * 0.003;
    this._lfo.connect(this._lfoGain);
    this._lfoGain.connect(this._delay.delayTime);
    this._lfo.start();
  }

  // ---- BPM-synced mode ----

  _computeDelayTime() {
    return (60 / this._bpm) * (this._interval ?? 0.75);
  }

  get bpm() {
    return this._bpm;
  }
  set bpm(v) {
    this._bpm = v;
    if (this._interval != null) {
      this._delay.delayTime.value = this._computeDelayTime();
    }
  }

  get interval() {
    return this._interval;
  }
  set interval(v) {
    this._interval = v;
    if (v != null) this._delay.delayTime.value = this._computeDelayTime();
  }

  // ---- Core properties ----

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

  // ---- Dub features ----

  get filterFreq() {
    return this._filter.frequency.value;
  }
  set filterFreq(v) {
    this._filter.frequency.value = v;
  }

  /** Modulation depth 0–1 (scaled internally to seconds). */
  get modulation() {
    return this._lfoGain.gain.value / 0.003;
  }
  set modulation(v) {
    this._lfoGain.gain.value = v * 0.003;
  }

  // ---- Routing ----

  get input() {
    return this._in;
  }

  connect(node) {
    this._out.connect(node.input ?? node);
    return this;
  }
}
