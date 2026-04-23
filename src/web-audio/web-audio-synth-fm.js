/**
 * WebAudioSynthFM — polyphonic 2-operator FM synthesizer.
 *
 * Models the carrier+modulator architecture of classic FM synthesis (à la DX-7):
 *
 *   [modOsc] → modEnv → carrierOsc.frequency   (the FM!)
 *   [carrierOsc] → carrierEnv → filter → output
 *
 * The modulation index (modIndex) sets frequency deviation depth:
 *   peak deviation Hz = carrierFreq × modIndex
 *
 * The modulator amplitude envelope (modAttack + modDecay) causes timbre to evolve
 * over time — bright/complex at onset, simpler/warmer on sustain — producing the
 * characteristic DX-7 electric-piano, bell, and pad sounds.
 *
 * trigger() accepts a single MIDI note or an array for chord playback.
 * All voices are fire-and-forget; nodes self-disconnect on ended.
 *
 * Usage:
 *   const fm = new WebAudioSynthFM(ctx, { modRatio: 3.5, modIndex: 4 });
 *   fm.connect(fxUnit);
 *   fm.trigger([48, 52, 55], stepDurSec, atTime);  // C major triad
 *
 * Presets:
 *   fm.applyPreset("Bell");
 *   // or: new WebAudioSynthFM(ctx, WebAudioSynthFM.PRESETS["Bell"]);
 */
export default class WebAudioSynthFM {

  /** Maps unprefixed preset keys to "fm"-prefixed param names used in demo UIs. */
  static PARAM_KEY_MAP = {
    carrierRatio: "fmCarrierRatio", modRatio: "fmModRatio", modIndex: "fmModIndex",
    modDecay: "fmModDecay", attack: "fmAttack", decay: "fmDecay",
    sustain: "fmSustain", release: "fmRelease", filterFreq: "fmFilterFreq",
    filterQ: "fmFilterQ", detune: "fmDetune", volume: "fmVolume",
  };

  // ---- DX-7-inspired presets ----

  static PRESETS = {
    "E.Piano": { carrierRatio: 1, modRatio: 2,   modIndex: 2.5, modDecay: 0.20, attack: 0.005, decay: 0.30, sustain: 0.15, release: 0.5,  filterFreq: 8000,  filterQ: 1, detune: 0, volume: 0.4  },
    "Bell":    { carrierRatio: 1, modRatio: 3.5, modIndex: 5,   modDecay: 0.06, attack: 0.001, decay: 1.20, sustain: 0.0,  release: 2.5,  filterFreq: 10000, filterQ: 1, detune: 0, volume: 0.35 },
    "Vibes":   { carrierRatio: 1, modRatio: 4,   modIndex: 1.5, modDecay: 0.08, attack: 0.001, decay: 0.30, sustain: 0.0,  release: 0.6,  filterFreq: 6000,  filterQ: 1, detune: 0, volume: 0.5  },
    "Organ":   { carrierRatio: 1, modRatio: 1,   modIndex: 1.5, modDecay: 1.00, attack: 0.015, decay: 0.08, sustain: 0.9,  release: 0.06, filterFreq: 5000,  filterQ: 1, detune: 5, volume: 0.35 },
    "Pad":     { carrierRatio: 1, modRatio: 2,   modIndex: 0.8, modDecay: 2.00, attack: 0.40,  decay: 0.60, sustain: 0.7,  release: 2.5,  filterFreq: 2500,  filterQ: 2, detune: 8, volume: 0.3  },
    "Pluck":   { carrierRatio: 1, modRatio: 7,   modIndex: 7,   modDecay: 0.04, attack: 0.001, decay: 0.12, sustain: 0.0,  release: 0.15, filterFreq: 5000,  filterQ: 1, detune: 0, volume: 0.55 },
    "Brass":   { carrierRatio: 1, modRatio: 1,   modIndex: 3,   modDecay: 0.15, attack: 0.08,  decay: 0.20, sustain: 0.6,  release: 0.3,  filterFreq: 4000,  filterQ: 2, detune: 0, volume: 0.4  },
    "Kalimba": { carrierRatio: 1, modRatio: 5,   modIndex: 2,   modDecay: 0.05, attack: 0.001, decay: 0.20, sustain: 0.0,  release: 0.35, filterFreq: 8000,  filterQ: 1, detune: 0, volume: 0.5  },
  };

  /**
   * @param {AudioContext} ctx
   * @param {object}  [options]
   * @param {number}  [options.carrierRatio=1]    Carrier freq ratio relative to note
   * @param {number}  [options.modRatio=2]        Modulator freq ratio (2 = octave above)
   * @param {number}  [options.modIndex=2]        FM depth: deviation = carrierFreq × modIndex
   * @param {number}  [options.modAttack=0.002]   Mod envelope attack (timbre brightness rise)
   * @param {number}  [options.modDecay=0.25]     Mod envelope decay (timbre brightness fall)
   * @param {number}  [options.attack=0.02]       Carrier amplitude attack
   * @param {number}  [options.decay=0.4]         Carrier amplitude decay
   * @param {number}  [options.sustain=0.3]       Carrier sustain level 0–1
   * @param {number}  [options.release=0.6]       Carrier release
   * @param {number}  [options.filterFreq=5000]   Output lowpass cutoff Hz
   * @param {number}  [options.filterQ=1]         Output filter resonance
   * @param {number}  [options.detune=0]          Carrier detune in cents (thickens stacked voices)
   * @param {number}  [options.volume=0.4]
   */
  constructor(ctx, options = {}) {
    this.ctx = ctx;
    this.carrierRatio = options.carrierRatio ?? 1;
    this.modRatio = options.modRatio ?? 2;
    this.modIndex = options.modIndex ?? 2;
    this.modAttack = options.modAttack ?? 0.002;
    this.modDecay = options.modDecay ?? 0.25;
    this.attack = options.attack ?? 0.02;
    this.decay = options.decay ?? 0.4;
    this.sustain = options.sustain ?? 0.3;
    this.release = options.release ?? 0.6;
    this.detune = options.detune ?? 0;

    this._filter = ctx.createBiquadFilter();
    this._filter.type = "lowpass";
    this._filter.frequency.value = options.filterFreq ?? 5000;
    this._filter.Q.value = options.filterQ ?? 1;

    this._out = ctx.createGain();
    this._out.gain.value = options.volume ?? 0.4;

    this._filter.connect(this._out);
  }

  // ---- Properties ----

  get volume() {
    return this._out.gain.value;
  }
  set volume(v) {
    this._out.gain.value = v;
  }

  get filterFreq() {
    return this._filter.frequency.value;
  }
  set filterFreq(v) {
    this._filter.frequency.value = v;
  }

  get filterQ() {
    return this._filter.Q.value;
  }
  set filterQ(v) {
    this._filter.Q.value = v;
  }

  // ---- Routing ----

  get input() {
    return this._out;
  }

  connect(node) {
    this._out.connect(node.input ?? node);
    return this;
  }

  /**
   * Apply a named preset, updating all synth parameters in place.
   * @param {string} name  Key of WebAudioSynthFM.PRESETS
   */
  applyPreset(name) {
    const p = WebAudioSynthFM.PRESETS[name];
    if (!p) return;
    if (p.carrierRatio != null) this.carrierRatio = p.carrierRatio;
    if (p.modRatio     != null) this.modRatio     = p.modRatio;
    if (p.modIndex     != null) this.modIndex     = p.modIndex;
    if (p.modAttack    != null) this.modAttack     = p.modAttack;
    if (p.modDecay     != null) this.modDecay      = p.modDecay;
    if (p.attack       != null) this.attack        = p.attack;
    if (p.decay        != null) this.decay         = p.decay;
    if (p.sustain      != null) this.sustain       = p.sustain;
    if (p.release      != null) this.release       = p.release;
    if (p.filterFreq   != null) this.filterFreq    = p.filterFreq;
    if (p.filterQ      != null) this.filterQ       = p.filterQ;
    if (p.detune       != null) this.detune        = p.detune;
    if (p.volume       != null) this.volume        = p.volume;
  }

  // ---- Helpers ----

  _midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // ---- Playback ----

  /**
   * @param {number|number[]} midiNotes  Single note or chord array
   * @param {number} stepDurSec
   * @param {number} atTime
   */
  trigger(midiNotes, stepDurSec, atTime) {
    const notes = Array.isArray(midiNotes) ? midiNotes : [midiNotes];
    const dur = this.attack + this.decay + this.release + 0.1;
    const gainScale = 1 / notes.length;  // prevent summed voices from clipping
    for (const midi of notes) this._voice(midi, dur, atTime, gainScale);
  }

  _voice(midi, dur, atTime, gainScale = 1) {
    const ctx = this.ctx;
    const baseFreq = this._midiToFreq(midi);
    const carrierFreq = baseFreq * this.carrierRatio;
    const modFreq = baseFreq * this.modRatio;
    const modDepth = carrierFreq * this.modIndex; // Hz deviation at peak

    // ---- Modulator — output drives carrier frequency (the FM connection) ----
    const modOsc = ctx.createOscillator();
    modOsc.type = "sine";
    modOsc.frequency.value = modFreq;

    const modEnv = ctx.createGain();
    modEnv.gain.setValueAtTime(0, atTime);
    modEnv.gain.linearRampToValueAtTime(modDepth, atTime + this.modAttack);
    modEnv.gain.exponentialRampToValueAtTime(
      Math.max(0.001, modDepth * 0.12), // hold at 12% — timbre darkens over time
      atTime + this.modAttack + this.modDecay,
    );

    // ---- Carrier ----
    const carrierOsc = ctx.createOscillator();
    carrierOsc.type = "sine";
    carrierOsc.frequency.value = carrierFreq;
    carrierOsc.detune.value = this.detune;

    const sus = Math.max(0.0001, this.sustain) * gainScale;
    const carrierEnv = ctx.createGain();
    carrierEnv.gain.setValueAtTime(0, atTime);
    carrierEnv.gain.linearRampToValueAtTime(gainScale, atTime + this.attack);
    carrierEnv.gain.exponentialRampToValueAtTime(sus, atTime + this.attack + this.decay);
    carrierEnv.gain.setValueAtTime(sus, atTime + this.attack + this.decay);
    carrierEnv.gain.exponentialRampToValueAtTime(0.0001, atTime + this.attack + this.decay + this.release);

    // ---- Connect ----
    modOsc.connect(modEnv);
    modEnv.connect(carrierOsc.frequency); // FM!
    carrierOsc.connect(carrierEnv);
    carrierEnv.connect(this._filter);

    modOsc.start(atTime);
    modOsc.stop(atTime + dur);
    carrierOsc.start(atTime);
    carrierOsc.stop(atTime + dur);

    carrierOsc.onended = () => {
      modOsc.disconnect();
      modEnv.disconnect();
      carrierOsc.disconnect();
      carrierEnv.disconnect();
    };
  }
}
