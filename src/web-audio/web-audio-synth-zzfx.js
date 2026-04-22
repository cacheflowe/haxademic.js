/**
 * WebAudioSynthZzfx — ZzFX-inspired procedural sound effect synthesizer.
 *
 * Bakes sound effects into AudioBuffers from a set of synthesis parameters:
 * oscillator shape, frequency, pitch slide/jump, amplitude envelope, noise,
 * tremolo, and bit-crush. Call randomize() to generate a new random squelch;
 * the buffer persists until the next randomize(). trigger() is fire-and-forget.
 *
 * Usage:
 *   const sfx = new WebAudioSynthZzfx(ctx, { volume: 0.5 });
 *   sfx.connect(ctx.destination);
 *   sfx.randomize();   // or call once at construction
 *   sfx.trigger(atTime);
 */
export default class WebAudioSynthZzfx {
  /**
   * @param {AudioContext} ctx
   * @param {object} [options]
   * @param {number}  [options.volume=0.6]
   * @param {boolean} [options.randomizeOnTrigger=false]  Bake a new sound on every trigger
   */
  constructor(ctx, options = {}) {
    this.ctx = ctx;
    this.randomizeOnTrigger = options.randomizeOnTrigger ?? false;
    this._buffer = null;
    this._params = null;

    // Volume gain (final output)
    this._out = ctx.createGain();
    this._out.gain.value = options.volume ?? 0.6;

    // HPF → LPF filter chain before output
    this._hpf = ctx.createBiquadFilter();
    this._hpf.type = "highpass";
    this._hpf.frequency.value = options.hpfFreq ?? 80;
    this._hpf.Q.value = 1;

    this._lpf = ctx.createBiquadFilter();
    this._lpf.type = "lowpass";
    this._lpf.frequency.value = options.lpfFreq ?? 1200;
    this._lpf.Q.value = options.lpfResonance ?? 1;

    this._hpf.connect(this._lpf);
    this._lpf.connect(this._out);

    this.randomize();
  }

  // ---- Properties ----

  get volume() { return this._out.gain.value; }
  set volume(v) { this._out.gain.value = v; }

  get lpfFreq() { return this._lpf.frequency.value; }
  set lpfFreq(v) { this._lpf.frequency.value = v; }

  get lpfResonance() { return this._lpf.Q.value; }
  set lpfResonance(v) { this._lpf.Q.value = v; }

  get hpfFreq() { return this._hpf.frequency.value; }
  set hpfFreq(v) { this._hpf.frequency.value = v; }

  // ---- Routing ----

  get input() { return this._hpf; }

  connect(node) {
    this._out.connect(node.input ?? node);
    return this;
  }

  // ---- Sound generation ----

  /** Bake a new random sound effect into the internal buffer. */
  randomize() {
    const r = () => Math.random();
    this._params = {
      frequency: 40 + r() * 760,         // capped at ~800 Hz to avoid shrillness
      attack: r() * 0.02,
      sustain: r() * 0.08,
      release: 0.04 + r() * 0.35,
      shape: Math.floor(r() * 4), // 0=sine 1=tri 2=saw 3=square
      noise: Math.pow(r(), 2) * 0.5,
      slide: (r() * 2 - 1) * 28,         // reduced range from 40
      pitchJump: (r() * 2 - 1) * 24,
      pitchJumpTime: r() * 0.18,
      tremolo: Math.pow(r(), 2) * 0.6,
      bitCrush: Math.pow(r(), 3) * 0.7,
    };
    this._buffer = this._generateBuffer(this._params);
  }

  /** Schedule one sound effect hit. */
  trigger(atTime) {
    if (this.randomizeOnTrigger) this.randomize();
    if (!this._buffer) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this._buffer;
    source.connect(this._hpf);  // route through filter chain
    source.start(atTime);
    source.onended = () => source.disconnect();
  }

  // ---- Synthesis ----

  _generateBuffer({
    frequency = 220,
    attack = 0.01,
    sustain = 0.05,
    release = 0.15,
    shape = 0,
    noise = 0,
    slide = 0,
    pitchJump = 0,
    pitchJumpTime = 0.05,
    tremolo = 0,
    bitCrush = 0,
  }) {
    const sr = this.ctx.sampleRate;
    const duration = attack + sustain + release;
    const length = Math.ceil(sr * duration);
    const buf = this.ctx.createBuffer(1, length, sr);
    const data = buf.getChannelData(0);
    let phase = 0;

    for (let i = 0; i < length; i++) {
      const t = i / sr;

      // Amplitude envelope
      let amp;
      if (t < attack) amp = attack > 0 ? t / attack : 1;
      else if (t < attack + sustain) amp = 1;
      else amp = Math.max(0, 1 - (t - attack - sustain) / release);

      // Tremolo
      if (tremolo > 0) amp *= 1 - tremolo * (0.5 + 0.5 * Math.sin(2 * Math.PI * 7 * t));

      // Frequency + pitch slide + jump
      const freq = frequency * Math.pow(2, (slide * t + (t >= pitchJumpTime ? pitchJump : 0)) / 12);
      phase = (phase + freq / sr) % 1;

      // Oscillator shape
      let s;
      switch (shape) {
        case 1:
          s = 1 - Math.abs(4 * phase - 2);
          break; // triangle
        case 2:
          s = 1 - 2 * phase;
          break; // sawtooth
        case 3:
          s = phase < 0.5 ? 1 : -1;
          break; // square
        default:
          s = Math.sin(2 * Math.PI * phase); // sine
      }

      // Noise mix
      if (noise > 0) s += noise * (Math.random() * 2 - 1);

      // Bit crush — quantize to 2–512 steps
      if (bitCrush > 0) {
        const steps = Math.pow(2, Math.max(1, Math.round((1 - bitCrush) * 9)));
        s = Math.round(s * steps) / steps;
      }

      data[i] = amp * Math.max(-1, Math.min(1, s));
    }

    return buf;
  }
}
