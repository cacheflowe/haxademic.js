import "./web-audio-slider.js";
import { injectControlsCSS, createTitleWithMute } from "./web-audio-slider.js";
import "./web-audio-step-seq.js";
import { buildChordFromScale, scaleNotesInRange, scaleNoteOptions } from "./web-audio-scales.js";

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

  static LFO_INTERVALS = [
    { label: "Off",   beats: 0 },
    { label: "4 bar", beats: 16 },
    { label: "2 bar", beats: 8 },
    { label: "1 bar", beats: 4 },
    { label: "1/2",   beats: 2 },
    { label: "1/4",   beats: 1 },
    { label: "1/8",   beats: 0.5 },
    { label: "1/16",  beats: 0.25 },
  ];

  static PRESETS = {
    E_Piano:   { carrierRatio: 1, modRatio: 2,   modIndex: 2.5, modDecay: 0.20, attack: 0.005, decay: 0.30, sustain: 0.15, release: 0.5,  filterFreq: 8000,  filterQ: 1,   detune: 0, volume: 0.4,  lfoInterval: 0, lfoDepth: 0, lfoShape: "sine" },
    "Bell":    { carrierRatio: 1, modRatio: 3.5, modIndex: 5,   modDecay: 0.06, attack: 0.001, decay: 1.20, sustain: 0.0,  release: 2.5,  filterFreq: 10000, filterQ: 1,   detune: 0, volume: 0.35, lfoInterval: 0, lfoDepth: 0, lfoShape: "sine" },
    "Vibes":   { carrierRatio: 1, modRatio: 4,   modIndex: 1.5, modDecay: 0.08, attack: 0.001, decay: 0.30, sustain: 0.0,  release: 0.6,  filterFreq: 6000,  filterQ: 1,   detune: 0, volume: 0.5,  lfoInterval: 0, lfoDepth: 0, lfoShape: "sine" },
    "Organ":   { carrierRatio: 1, modRatio: 1,   modIndex: 1.5, modDecay: 1.00, attack: 0.015, decay: 0.08, sustain: 0.9,  release: 0.06, filterFreq: 5000,  filterQ: 1,   detune: 5, volume: 0.35, lfoInterval: 0, lfoDepth: 0, lfoShape: "sine" },
    "Pad":     { carrierRatio: 1, modRatio: 2,   modIndex: 0.8, modDecay: 2.00, attack: 0.40,  decay: 0.60, sustain: 0.7,  release: 2.5,  filterFreq: 2500,  filterQ: 2,   detune: 8, volume: 0.3,  lfoInterval: 4, lfoDepth: 800, lfoShape: "sine" },
    "Pluck":   { carrierRatio: 1, modRatio: 7,   modIndex: 7,   modDecay: 0.04, attack: 0.001, decay: 0.12, sustain: 0.0,  release: 0.15, filterFreq: 5000,  filterQ: 1,   detune: 0, volume: 0.55, lfoInterval: 0, lfoDepth: 0, lfoShape: "sine" },
    "Brass":   { carrierRatio: 1, modRatio: 1,   modIndex: 3,   modDecay: 0.15, attack: 0.08,  decay: 0.20, sustain: 0.6,  release: 0.3,  filterFreq: 4000,  filterQ: 2,   detune: 0, volume: 0.4,  lfoInterval: 0, lfoDepth: 0, lfoShape: "sine" },
    "Kalimba": { carrierRatio: 1, modRatio: 5,   modIndex: 2,   modDecay: 0.05, attack: 0.001, decay: 0.20, sustain: 0.0,  release: 0.35, filterFreq: 8000,  filterQ: 1,   detune: 0, volume: 0.5,  lfoInterval: 0, lfoDepth: 0, lfoShape: "sine" },
    "Marimba": { carrierRatio: 1, modRatio: 4,   modIndex: 3,   modDecay: 0.10, attack: 0.002, decay: 0.40, sustain: 0.0,  release: 0.2,  filterFreq: 6000,  filterQ: 1,   detune: 0, volume: 0.9,  lfoInterval: 0, lfoDepth: 0, lfoShape: "sine" },
    "Glass":   { carrierRatio: 1, modRatio: 7,   modIndex: 2,   modDecay: 0.80, attack: 0.01,  decay: 1.50, sustain: 0.2,  release: 1.0,  filterFreq: 10000, filterQ: 0.5, detune: 3, volume: 0.8,  lfoInterval: 0, lfoDepth: 0, lfoShape: "sine" },
    "Sitar":   { carrierRatio: 1, modRatio: 5,   modIndex: 6,   modDecay: 0.30, attack: 0.003, decay: 0.80, sustain: 0.1,  release: 0.5,  filterFreq: 4000,  filterQ: 3,   detune: 0, volume: 0.85, lfoInterval: 0, lfoDepth: 0, lfoShape: "sine" },
    "Wobble":  { carrierRatio: 1, modRatio: 2,   modIndex: 1.5, modDecay: 0.50, attack: 0.01,  decay: 0.40, sustain: 0.5,  release: 1.0,  filterFreq: 3000,  filterQ: 6,   detune: 0, volume: 0.4,  lfoInterval: 1, lfoDepth: 1500, lfoShape: "sine" },
    "Shimmer": { carrierRatio: 1, modRatio: 3,   modIndex: 1.2, modDecay: 1.50, attack: 0.30,  decay: 0.80, sustain: 0.6,  release: 2.0,  filterFreq: 4000,  filterQ: 3,   detune: 6, volume: 0.35, lfoInterval: 8, lfoDepth: 1200, lfoShape: "triangle" },
    "Reese":   { carrierRatio: 1, modRatio: 1,   modIndex: 0.5, modDecay: 0.80, attack: 0.02,  decay: 0.50, sustain: 0.6,  release: 1.5,  filterFreq: 1200,  filterQ: 4,   detune: 8, volume: 0.4,  lfoInterval: 4, lfoDepth: 600, lfoShape: "triangle" },
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
  constructor(ctx, preset = "E_Piano") {
    this.ctx = ctx;
    this.modAttack = 0.002; // default — not in presets, but used by _voice

    this._filter = ctx.createBiquadFilter();
    this._filter.type = "lowpass";

    this._out = ctx.createGain();
    this._filter.connect(this._out);

    // Filter LFO — continuous oscillator modulating filter cutoff
    this._lfo = ctx.createOscillator();
    this._lfo.type = "sine";
    this._lfo.frequency.value = 0;
    this._lfoGain = ctx.createGain();
    this._lfoGain.gain.value = 0; // depth in Hz, 0 = off
    this._lfo.connect(this._lfoGain);
    this._lfoGain.connect(this._filter.frequency);
    this._lfo.start();

    this._lfoInterval = 0; // beats (0 = off)
    this._bpm = 120;

    this.applyPreset(preset);
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

  get lfoInterval() { return this._lfoInterval; }
  set lfoInterval(v) { this._lfoInterval = v; this._updateLfoFreq(); }

  get bpm() { return this._bpm; }
  set bpm(v) { this._bpm = v; this._updateLfoFreq(); }

  get lfoDepth() { return this._lfoGain.gain.value; }
  set lfoDepth(v) { this._lfoGain.gain.value = v; }

  get lfoShape() { return this._lfo.type; }
  set lfoShape(v) { this._lfo.type = v; }

  _updateLfoFreq() {
    this._lfo.frequency.value = this._lfoInterval > 0
      ? (this._bpm / 60) / this._lfoInterval
      : 0;
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
    if (p.lfoInterval != null) this.lfoInterval  = p.lfoInterval;
    if (p.lfoDepth     != null) this.lfoDepth      = p.lfoDepth;
    if (p.lfoShape     != null) this.lfoShape      = p.lfoShape;
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

// ---- Controls companion component ----

export class WebAudioSynthFMControls extends HTMLElement {

  static SLIDER_DEFS = [
    { param: "volume",       label: "Vol",        min: 0,    max: 1,     step: 0.01 },
    { param: "carrierRatio", label: "Carrier",    min: 0.5,  max: 4,     step: 0.01 },
    { param: "modRatio",     label: "Mod Ratio",  min: 0.5,  max: 8,     step: 0.01 },
    { param: "modIndex",     label: "Mod Index",  min: 0,    max: 10,    step: 0.1 },
    { param: "modDecay",     label: "Mod Decay",  min: 0.01, max: 2,     step: 0.01 },
    { param: "attack",       label: "Attack",     min: 0.001,max: 1,     step: 0.001 },
    { param: "decay",        label: "Decay",      min: 0.01, max: 2,     step: 0.01 },
    { param: "sustain",      label: "Sustain",    min: 0,    max: 1,     step: 0.01 },
    { param: "release",      label: "Release",    min: 0.01, max: 3,     step: 0.01 },
    { param: "filterFreq",   label: "Filter",     min: 100,  max: 12000, step: 1, scale: "log" },
    { param: "filterQ",      label: "Filter Q",   min: 0.5,  max: 20,    step: 0.1 },
    { param: "detune",       label: "Detune",     min: -50,  max: 50,    step: 1 },
    { param: "lfoDepth",     label: "LFO Depth",  min: 0,    max: 3000,  step: 10 },
  ];

  static DEFAULT_PATTERN() {
    const active = new Set([0, 8]);
    return Array.from({ length: 16 }, (_, i) => ({ active: active.has(i), note: 29 }));
  }

  constructor() {
    super();
    this._instrument = null;
    this._ctx = null;
    this._sliders = {};
    this._presetSelect = null;
    this._chordSizeSelect = null;
    this._lfoShapeSelect = null;
    this._lfoIntervalSelect = null;
    this._fxUnit = null;
    this._out = null;
    this._seq = null;
    this._rootMidi = 29;
    this._scaleName = "Minor";
    this._chordSize = 3;
  }

  bind(instrument, ctx, options = {}) {
    this._instrument = instrument;
    this._ctx = ctx;
    this._chordSize = options.chordSize ?? 3;
    const color = options.color || "#4af";
    // Set BPM on instrument so LFO interval computes correctly
    if (options.fx?.bpm) instrument.bpm = options.fx.bpm;
    this.innerHTML = "";
    injectControlsCSS();
    this.style.setProperty("--slider-accent", color);
    this.style.setProperty("--fx-accent", color);

    this._muteHandle = createTitleWithMute(this, options.title || "FM Chord Synth", () => this._out);

    const controls = document.createElement("div");
    controls.className = "wac-controls";
    this.appendChild(controls);

    // Preset dropdown
    this._presetSelect = document.createElement("select");
    this._presetSelect.className = "wac-select";
    Object.keys(WebAudioSynthFM.PRESETS).forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name.replace(/_/g, " ");
      this._presetSelect.appendChild(opt);
    });
    this._presetSelect.addEventListener("change", () => {
      this.applyPreset(this._presetSelect.value);
      this._emitChange();
    });
    controls.appendChild(this._presetSelect);

    for (const def of WebAudioSynthFMControls.SLIDER_DEFS) {
      const slider = document.createElement("web-audio-slider");
      slider.setAttribute("param", def.param);
      slider.setAttribute("label", def.label);
      slider.setAttribute("min", def.min);
      slider.setAttribute("max", def.max);
      slider.setAttribute("step", def.step);
      if (def.scale) slider.setAttribute("scale", def.scale);
      slider.value = instrument[def.param];
      controls.appendChild(slider);
      this._sliders[def.param] = slider;
    }

    // LFO interval dropdown (BPM-synced)
    const lfoIntWrap = document.createElement("div");
    lfoIntWrap.className = "wac-ctrl";
    lfoIntWrap.appendChild(Object.assign(document.createElement("label"), { textContent: "LFO Rate" }));
    this._lfoIntervalSelect = document.createElement("select");
    this._lfoIntervalSelect.className = "wac-select";
    for (const { label, beats } of WebAudioSynthFM.LFO_INTERVALS) {
      const opt = document.createElement("option");
      opt.value = beats;
      opt.textContent = label;
      if (beats === instrument.lfoInterval) opt.selected = true;
      this._lfoIntervalSelect.appendChild(opt);
    }
    this._lfoIntervalSelect.addEventListener("change", () => {
      this._instrument.lfoInterval = parseFloat(this._lfoIntervalSelect.value);
      this._emitChange();
    });
    lfoIntWrap.appendChild(this._lfoIntervalSelect);
    controls.appendChild(lfoIntWrap);

    // LFO shape dropdown
    const lfoWrap = document.createElement("div");
    lfoWrap.className = "wac-ctrl";
    lfoWrap.appendChild(Object.assign(document.createElement("label"), { textContent: "LFO Shape" }));
    this._lfoShapeSelect = document.createElement("select");
    this._lfoShapeSelect.className = "wac-select";
    for (const shape of ["sine", "triangle", "sawtooth", "square"]) {
      const opt = document.createElement("option");
      opt.value = shape;
      opt.textContent = shape;
      if (shape === instrument.lfoShape) opt.selected = true;
      this._lfoShapeSelect.appendChild(opt);
    }
    this._lfoShapeSelect.addEventListener("change", () => {
      this._instrument.lfoShape = this._lfoShapeSelect.value;
      this._emitChange();
    });
    lfoWrap.appendChild(this._lfoShapeSelect);
    controls.appendChild(lfoWrap);

    this.addEventListener("slider-input", (e) => {
      if (!this._instrument) return;
      this._instrument[e.detail.param] = e.detail.value;
      this._emitChange();
    });

    // Action row
    const actionRow = document.createElement("div");
    actionRow.className = "wac-action-row";

    const chordSizeSelect = document.createElement("select");
    chordSizeSelect.className = "wac-select";
    this._chordSizeSelect = chordSizeSelect;
    [2, 3, 4].forEach((n) => {
      const opt = document.createElement("option");
      opt.value = n;
      opt.textContent = `${n} notes`;
      if (n === this._chordSize) opt.selected = true;
      chordSizeSelect.appendChild(opt);
    });
    chordSizeSelect.addEventListener("change", () => {
      this._chordSize = parseInt(chordSizeSelect.value);
      this._emitChange();
    });
    actionRow.appendChild(chordSizeSelect);

    const presetBtn = document.createElement("button");
    presetBtn.textContent = "⚄ Rand Preset";
    presetBtn.className = "wac-action-btn";
    presetBtn.addEventListener("click", () => {
      const names = Object.keys(WebAudioSynthFM.PRESETS);
      this.applyPreset(names[Math.floor(Math.random() * names.length)]);
      this._emitChange();
    });
    actionRow.appendChild(presetBtn);

    const randBtn = document.createElement("button");
    randBtn.textContent = "⚄ Rand Seq";
    randBtn.className = "wac-action-btn";
    randBtn.addEventListener("click", () => this.randomize());
    actionRow.appendChild(randBtn);

    const chordBtn = document.createElement("button");
    chordBtn.textContent = "♫ Chord [N]";
    chordBtn.className = "wac-action-btn";
    chordBtn.addEventListener("click", () => this.triggerJamChord());
    actionRow.appendChild(chordBtn);

    this.appendChild(actionRow);

    // Step sequencer
    this._seq = document.createElement("web-audio-step-seq");
    const noteOpts = scaleNoteOptions(this._rootMidi, this._scaleName, 24, 48);
    this._seq.init({
      steps: WebAudioSynthFMControls.DEFAULT_PATTERN(),
      noteOptions: noteOpts,
      color,
    });
    this.appendChild(this._seq);
    this._seq.addEventListener("step-change", () => this._emitChange());

    // FX unit
    this._fxUnit = document.createElement("web-audio-fx-unit");
    this.appendChild(this._fxUnit);
    this._fxUnit.init(ctx, { title: "FM FX", bpm: options.fx?.bpm ?? 120, ...options.fx });

    // Waveform
    const waveform = document.createElement("web-audio-waveform");
    this.appendChild(waveform);

    // Audio routing
    const analyser = ctx.createAnalyser();
    instrument.connect(analyser);
    analyser.connect(this._fxUnit.input);
    this._out = ctx.createGain();
    this._fxUnit.connect(this._out);
    waveform.init(analyser, color);
  }

  // ---- Sequencer integration ----

  step(index, time, stepDurationSec) {
    if (!this._instrument || !this._seq) return;
    const s = this._seq.steps[index];
    if (s?.active) {
      const chord = buildChordFromScale(s.note + 24, this._scaleName, this._chordSize);
      this._instrument.trigger(chord, stepDurationSec, time);
    }
  }

  setActiveStep(i) { this._seq?.setActiveStep(i); }

  setScale(rootMidi, scaleName) {
    this._rootMidi = rootMidi;
    this._scaleName = scaleName;
    this._seq?.setNoteOptions(scaleNoteOptions(rootMidi, scaleName, 24, 48));
  }

  triggerJamChord() {
    if (!this._instrument || !this._ctx) return;
    const chord = buildChordFromScale(this._rootMidi + 24, this._scaleName, this._chordSize);
    this._instrument.trigger(chord, 0.25, this._ctx.currentTime);
  }

  randomize() {
    const scaleNotes = scaleNotesInRange(this._rootMidi, this._scaleName, 24, 48);
    if (!scaleNotes.length) return;
    const numActive = 1 + Math.floor(Math.random() * 3);
    const activeSet = new Set([0]);
    while (activeSet.size < numActive) activeSet.add(Math.floor(Math.random() * 16));
    const newSteps = Array.from({ length: 16 }, (_, i) => ({
      active: activeSet.has(i),
      note: scaleNotes[Math.floor(Math.random() * scaleNotes.length)],
    }));
    if (this._seq) this._seq.steps = newSteps;
    this._emitChange();
  }

  // ---- Serialization ----

  _emitChange() {
    this.dispatchEvent(new CustomEvent("controls-change", { bubbles: true }));
  }

  toJSON() {
    if (!this._instrument) return null;
    const params = {};
    for (const def of WebAudioSynthFMControls.SLIDER_DEFS) params[def.param] = this._instrument[def.param];
    params.lfoInterval = this._instrument.lfoInterval;
    params.lfoShape = this._instrument.lfoShape;
    return {
      params,
      steps: this._seq?.steps ?? [],
      chordSize: this._chordSize,
      fx: this._fxUnit?.toJSON(),
      muted: this._muteHandle?.isMuted() ?? false,
    };
  }

  fromJSON(obj) {
    if (!obj || !this._instrument) return;
    if (obj.params) {
      for (const [key, val] of Object.entries(obj.params)) {
        if (key === "lfoShape") {
          this._instrument.lfoShape = val;
          if (this._lfoShapeSelect) this._lfoShapeSelect.value = val;
        } else if (key === "lfoInterval") {
          this._instrument.lfoInterval = val;
          if (this._lfoIntervalSelect) this._lfoIntervalSelect.value = val;
        } else if (key === "lfoRate") {
          // back-compat: old saves used Hz-based lfoRate — ignore, default interval is fine
        } else {
          this._instrument[key] = val;
          if (this._sliders[key]) this._sliders[key].value = val;
        }
      }
    }
    if (obj.chordSize != null) {
      this._chordSize = obj.chordSize;
      if (this._chordSizeSelect) this._chordSizeSelect.value = obj.chordSize;
    }
    if (obj.steps && this._seq) this._seq.steps = obj.steps;
    if (obj.fx) this._fxUnit?.fromJSON(obj.fx);
    if (obj.muted != null) this._muteHandle?.setMuted(obj.muted);
  }

  // ---- Preset / routing ----

  applyPreset(name) {
    if (!this._instrument) return;
    this._instrument.applyPreset(name);
    for (const def of WebAudioSynthFMControls.SLIDER_DEFS) {
      const slider = this._sliders[def.param];
      if (slider) slider.value = this._instrument[def.param];
    }
    if (this._presetSelect) this._presetSelect.value = name;
    if (this._lfoShapeSelect) this._lfoShapeSelect.value = this._instrument.lfoShape;
    if (this._lfoIntervalSelect) this._lfoIntervalSelect.value = this._instrument.lfoInterval;
  }

  set bpm(v) {
    if (this._fxUnit) this._fxUnit.bpm = v;
    if (this._instrument) this._instrument.bpm = v;
  }

  connect(node) {
    if (this._out) this._out.connect(node.input ?? node);
    return this;
  }
}

customElements.define("web-audio-synth-fm-controls", WebAudioSynthFMControls);
