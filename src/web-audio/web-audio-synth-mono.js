/**
 * WebAudioSynthMono — monophonic synth with lowpass filter and ADSR envelopes.
 *
 * Each trigger is fire-and-forget: a fresh set of nodes is created per note and
 * automatically garbage-collected when the oscillator stops. This is the standard
 * Web Audio pattern for polyphonic-style scheduling.
 *
 * Connect pattern (works with plain AudioNodes and other library classes):
 *   const synth = new WebAudioSynthMono(ctx, { oscType: 'sawtooth' });
 *   synth.connect(someEffect);   // effect exposes .input
 *   synth.connect(ctx.destination); // or plain AudioNode
 */
export default class WebAudioSynthMono {
  static PRESETS = {
    Default: {
      oscType: "sawtooth",
      attack: 0.02,
      decay: 0.2,
      sustain: 0.5,
      release: 0.4,
      filterFreq: 600,
      filterQ: 4,
      filterEnvOctaves: 2,
      detune: 0,
      detune2: 0,
      subGain: 0,
      volume: 1,
    },
    Bass: {
      oscType: "sawtooth",
      attack: 0.01,
      decay: 0.3,
      sustain: 0.6,
      release: 0.3,
      filterFreq: 400,
      filterQ: 6,
      filterEnvOctaves: 3,
      detune: 0,
      detune2: 0,
      subGain: 0.4,
      volume: 1,
    },
    Lead: {
      oscType: "sawtooth",
      attack: 0.01,
      decay: 0.15,
      sustain: 0.7,
      release: 0.5,
      filterFreq: 1200,
      filterQ: 5,
      filterEnvOctaves: 2,
      detune: 5,
      detune2: 8,
      subGain: 0,
      volume: 0.9,
    },
    Pad: {
      oscType: "triangle",
      attack: 0.4,
      decay: 0.5,
      sustain: 0.8,
      release: 1.5,
      filterFreq: 800,
      filterQ: 2,
      filterEnvOctaves: 1,
      detune: 0,
      detune2: 12,
      subGain: 0,
      volume: 0.8,
    },
    Pluck: {
      oscType: "square",
      attack: 0.001,
      decay: 0.1,
      sustain: 0.0,
      release: 0.2,
      filterFreq: 2000,
      filterQ: 8,
      filterEnvOctaves: 3,
      detune: 0,
      detune2: 0,
      subGain: 0,
      volume: 0.9,
    },
  };

  constructor(ctx, options = {}) {
    this.ctx = ctx;
    this.oscType = options.oscType ?? "sawtooth";
    this.attack = options.attack ?? 0.02;
    this.decay = options.decay ?? 0.2;
    this.sustain = options.sustain ?? 0.5;
    this.release = options.release ?? 0.4;
    this.filterFreq = options.filterFreq ?? 600; // sustain cutoff (Hz)
    this.filterQ = options.filterQ ?? 4;
    this.filterEnvOctaves = options.filterEnvOctaves ?? 2; // octaves above filterFreq at attack peak
    this.detune = options.detune ?? 0; // cents — overall pitch offset (wobble, transpose)
    this.detune2 = options.detune2 ?? 0; // cents spread — adds a second osc detuned opposite for thickness
    this.subGain = options.subGain ?? 0; // 0–1 — sine sub-oscillator one octave below (bypasses filter)

    this._out = ctx.createGain();
    this._out.gain.value = options.volume ?? 1;
  }

  /**
   * Apply a named preset, updating all synth parameters in place.
   * @param {string} name  Key of WebAudioSynthMono.PRESETS
   */
  applyPreset(name) {
    const p = WebAudioSynthMono.PRESETS[name];
    if (!p) return;
    if (p.oscType          != null) this.oscType          = p.oscType;
    if (p.attack           != null) this.attack           = p.attack;
    if (p.decay            != null) this.decay            = p.decay;
    if (p.sustain          != null) this.sustain          = p.sustain;
    if (p.release          != null) this.release          = p.release;
    if (p.filterFreq       != null) this.filterFreq       = p.filterFreq;
    if (p.filterQ          != null) this.filterQ          = p.filterQ;
    if (p.filterEnvOctaves != null) this.filterEnvOctaves = p.filterEnvOctaves;
    if (p.detune           != null) this.detune           = p.detune;
    if (p.detune2          != null) this.detune2          = p.detune2;
    if (p.subGain          != null) this.subGain          = p.subGain;
    if (p.volume           != null) this._out.gain.value  = p.volume;
  }

  /** AudioNode that downstream effects/nodes should connect to this._out. */
  get input() {
    return this._out;
  }

  /** Chain to a downstream AudioNode or library effect object. */
  connect(node) {
    this._out.connect(node.input ?? node);
    return this;
  }

  /**
   * Schedule a note.
   * @param {number} midiNote  MIDI note number (21–108)
   * @param {number} durationSec  Note-on duration in seconds
   * @param {number} [velocity]   0–1 amplitude scalar
   * @param {number} [atTime]     AudioContext time (defaults to currentTime)
   */
  trigger(midiNote, durationSec, velocity = 1, atTime = 0) {
    const ctx = this.ctx;
    const t = atTime > 0 ? atTime : ctx.currentTime;
    const freq = 440 * Math.pow(2, (midiNote - 69) / 12);
    const stopTime = t + durationSec + this.release + 0.05;

    // Mixer collects oscillator voices before the filter
    const mixer = ctx.createGain();
    // Compensate gain when doubled to avoid clipping
    mixer.gain.value = this.detune2 > 0 ? 0.65 : 1;

    const filter = ctx.createBiquadFilter();
    const amp = ctx.createGain();

    // Primary oscillator
    const osc = ctx.createOscillator();
    osc.type = this.oscType;
    osc.frequency.value = freq;
    osc.detune.value = this.detune + (this.detune2 > 0 ? this.detune2 / 2 : 0);
    osc.connect(mixer);
    osc.start(t);
    osc.stop(stopTime);

    // Second detuned oscillator — spreads toward thickness/chorus
    if (this.detune2 > 0) {
      const osc2 = ctx.createOscillator();
      osc2.type = this.oscType;
      osc2.frequency.value = freq;
      osc2.detune.value = this.detune - this.detune2 / 2;
      osc2.connect(mixer);
      osc2.start(t);
      osc2.stop(stopTime);
    }

    // Sub oscillator — sine one octave below, bypasses the main filter for clean body
    if (this.subGain > 0) {
      const subOsc = ctx.createOscillator();
      const subAmp = ctx.createGain();
      subOsc.type = "sine";
      subOsc.frequency.value = freq / 2;
      subAmp.gain.value = this.subGain;
      subOsc.connect(subAmp);
      subAmp.connect(amp); // skip filter so sub stays full-range
      subOsc.start(t);
      subOsc.stop(stopTime);
    }

    filter.type = "lowpass";
    filter.Q.value = this.filterQ;

    // Filter envelope: sweep up to peak then decay back to base
    const peakFreq = this.filterFreq * Math.pow(2, this.filterEnvOctaves);
    filter.frequency.setValueAtTime(this.filterFreq, t);
    filter.frequency.linearRampToValueAtTime(peakFreq, t + this.attack);
    filter.frequency.exponentialRampToValueAtTime(Math.max(1, this.filterFreq), t + this.attack + this.decay);

    // Amplitude ADSR
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(velocity, t + this.attack);
    amp.gain.linearRampToValueAtTime(velocity * this.sustain, t + this.attack + this.decay);
    amp.gain.setValueAtTime(velocity * this.sustain, t + durationSec);
    amp.gain.linearRampToValueAtTime(0, t + durationSec + this.release);

    mixer.connect(filter);
    filter.connect(amp);
    amp.connect(this._out);

    return this;
  }
}
