import "./web-audio-slider.js";
import { injectControlsCSS, createTitleWithMute } from "./web-audio-slider.js";
import "./web-audio-step-seq.js";
import { scaleNotesInRange, scaleNoteOptions, STEP_WEIGHTS } from "./web-audio-scales.js";

/**
 * WebAudioSynthAcid — TB-303-style monophonic acid bass synthesizer.
 *
 * Fire-and-forget voice architecture: each trigger() call creates a fresh
 * oscillator/filter/VCA chain scheduled precisely at `atTime`. Nodes are
 * self-cleaning via osc.onended.
 *
 * Routing convention:
 *   synth.connect(masterGain);          // dry
 *   synth.connect(delayNode);           // or connect to wet send too
 *
 * Usage:
 *   const acid = new WebAudioSynthAcid(ctx, { cutoff: 800, resonance: 20 });
 *   acid.connect(ctx.destination);
 *   acid.trigger(midi, stepDurSec, accent, atTime);
 *   acid.reset(); // clear portamento tracking (call on stop/restart)
 */
export default class WebAudioSynthAcid {

  static PRESETS = {
    Default: { cutoff: 600,  resonance: 18, envMod: 0.6, decay: 0.25, attack: 0.005, distortion: 0,   portamento: 0,    oscType: "sawtooth", volume: 1.0, unisonVoices: 1, unisonDetune: 0 },
    Squelch: { cutoff: 400,  resonance: 24, envMod: 0.9, decay: 0.18, attack: 0.003, distortion: 0,   portamento: 0,    oscType: "sawtooth", volume: 0.9, unisonVoices: 1, unisonDetune: 0 },
    Growl:   { cutoff: 300,  resonance: 16, envMod: 0.7, decay: 0.35, attack: 0.008, distortion: 0.4, portamento: 0,    oscType: "sawtooth", volume: 0.85, unisonVoices: 1, unisonDetune: 0 },
    Smooth:  { cutoff: 800,  resonance: 8,  envMod: 0.4, decay: 0.40, attack: 0.015, distortion: 0,   portamento: 0.05, oscType: "sawtooth", volume: 1.0, unisonVoices: 1, unisonDetune: 0 },
    Square:  { cutoff: 500,  resonance: 20, envMod: 0.75,decay: 0.20, attack: 0.004, distortion: 0,   portamento: 0,    oscType: "square",   volume: 0.8, unisonVoices: 1, unisonDetune: 0 },
    Fat:     { cutoff: 500,  resonance: 14, envMod: 0.5, decay: 0.3,  attack: 0.005, distortion: 0.2, portamento: 0,    oscType: "sawtooth", volume: 0.9, unisonVoices: 3, unisonDetune: 15 },
    Hoover:  { cutoff: 600,  resonance: 10, envMod: 0.5, decay: 0.4,  attack: 0.01,  distortion: 0.3, portamento: 0.08, oscType: "sawtooth", volume: 0.85, unisonVoices: 4, unisonDetune: 30 },
  };

  /**
   * @param {AudioContext} ctx
   * @param {object} [options]
   * @param {number} [options.cutoff=600]       Base filter frequency in Hz
   * @param {number} [options.resonance=18]     Filter Q
   * @param {number} [options.envMod=0.6]       Filter envelope depth (0–1)
   * @param {number} [options.decay=0.25]       Filter/amp decay in seconds
   * @param {number} [options.attack=0.005]     Filter/amp attack in seconds
   * @param {number} [options.distortion=0]     Distortion amount (0–1)
   * @param {number} [options.portamento=0]     Glide time in seconds
   * @param {'sawtooth'|'square'} [options.oscType='sawtooth']
   * @param {number} [options.volume=1.0]
   */
  constructor(ctx, preset = "Default") {
    this.ctx = ctx;
    this._distortion = 0;
    this._distortionCurve = this._makeDistortionCurve(0);
    this._lastScheduledFreq = null;
    this._out = ctx.createGain();
    this.unisonVoices = 1;
    this.unisonDetune = 0;
    this.applyPreset(preset);
  }

  // ---- Properties ----

  get distortion() {
    return this._distortion;
  }

  set distortion(v) {
    this._distortion = v;
    this._distortionCurve = this._makeDistortionCurve(v);
  }

  get volume() {
    return this._out.gain.value;
  }

  set volume(v) {
    this._out.gain.value = v;
  }

  // ---- Routing ----

  get input() {
    return this._out;
  }

  connect(node) {
    this._out.connect(node.input ?? node);
    return this;
  }

  // ---- Helpers ----

  _midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  _makeDistortionCurve(amount) {
    const n = 512;
    const curve = new Float32Array(n);
    const k = amount * 200;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = k > 0 ? ((Math.PI + k) * x) / (Math.PI + k * Math.abs(x)) : x;
    }
    return curve;
  }

  /**
   * Apply a named preset, updating all synth parameters in place.
   * @param {string} name  Key of WebAudioSynthAcid.PRESETS
   */
  applyPreset(name) {
    const p = WebAudioSynthAcid.PRESETS[name];
    if (!p) return;
    if (p.cutoff     != null) this.cutoff     = p.cutoff;
    if (p.resonance  != null) this.resonance  = p.resonance;
    if (p.envMod     != null) this.envMod     = p.envMod;
    if (p.decay      != null) this.decay      = p.decay;
    if (p.attack     != null) this.attack     = p.attack;
    if (p.distortion != null) this.distortion = p.distortion;
    if (p.portamento != null) this.portamento = p.portamento;
    if (p.oscType    != null) this.oscType    = p.oscType;
    if (p.volume     != null) this.volume     = p.volume;
    if (p.unisonVoices != null) this.unisonVoices = p.unisonVoices;
    if (p.unisonDetune != null) this.unisonDetune = p.unisonDetune;
  }

  /** Clear portamento memory — call when stopping/restarting the sequencer. */
  reset() {
    this._lastScheduledFreq = null;
  }

  // ---- Playback ----

  /**
   * Schedule one note.
   *
   * @param {number} midi        MIDI note number (24–60 typical for acid bass)
   * @param {number} stepDurSec  Duration of one sequencer step in seconds
   * @param {boolean} accent     Accent flag — louder with stronger filter sweep
   * @param {number} atTime      AudioContext scheduled time
   */
  trigger(midi, stepDurSec, accent, atTime) {
    const ctx = this.ctx;
    const freq = this._midiToFreq(midi);
    const prevFreq = this._lastScheduledFreq;
    this._lastScheduledFreq = freq;

    const dist = ctx.createWaveShaper();
    const filter = ctx.createBiquadFilter();
    const vca = ctx.createGain();

    // Distortion before filter so harmonics get shaped by the cutoff sweep
    dist.curve = this._distortionCurve;

    // Filter envelope
    filter.type = "lowpass";
    filter.Q.value = this.resonance;
    const base = this.cutoff;
    const peak = Math.min(base + base * this.envMod * 4 * (accent ? 1.5 : 1), 18000);
    filter.frequency.setValueAtTime(base, atTime);
    filter.frequency.linearRampToValueAtTime(peak, atTime + this.attack);
    filter.frequency.exponentialRampToValueAtTime(Math.max(base, 30), atTime + this.attack + this.decay);

    // VCA envelope — attack matches filter attack for a unified feel
    const vel = accent ? 1.0 : 0.65;
    const hold = stepDurSec * 0.7;
    const release = 0.05;
    vca.gain.setValueAtTime(0.0001, atTime);
    vca.gain.linearRampToValueAtTime(vel, atTime + this.attack);
    vca.gain.setValueAtTime(vel, atTime + hold);
    vca.gain.exponentialRampToValueAtTime(0.0001, atTime + hold + release);

    // Create oscillator(s) — unison voices with symmetric detune spread
    const numVoices = Math.max(1, Math.round(this.unisonVoices));
    const voiceGain = 1 / numVoices;
    const oscs = [];

    for (let v = 0; v < numVoices; v++) {
      const osc = ctx.createOscillator();
      osc.type = this.oscType;

      // Detune spread: symmetric around center
      const detuneOffset = numVoices > 1
        ? this.unisonDetune * ((v / (numVoices - 1)) * 2 - 1)
        : 0;
      osc.detune.value = detuneOffset;

      // Portamento: slide from previous note's frequency
      if (this.portamento > 0 && prevFreq !== null && prevFreq !== freq) {
        osc.frequency.setValueAtTime(prevFreq, atTime);
        osc.frequency.exponentialRampToValueAtTime(freq, atTime + this.portamento);
      } else {
        osc.frequency.setValueAtTime(freq, atTime);
      }

      // Per-voice gain for headroom
      if (numVoices > 1) {
        const vGain = ctx.createGain();
        vGain.gain.value = voiceGain;
        osc.connect(vGain);
        vGain.connect(dist);
        osc.onended = () => { osc.disconnect(); vGain.disconnect(); };
      } else {
        osc.connect(dist);
        osc.onended = () => { osc.disconnect(); };
      }

      osc.start(atTime);
      osc.stop(atTime + hold + release + 0.01);
      oscs.push(osc);
    }

    // Chain: oscs → dist → filter → vca → output
    dist.connect(filter);
    filter.connect(vca);
    vca.connect(this._out);

    // Clean up shared nodes when last voice ends
    oscs[oscs.length - 1].addEventListener("ended", () => {
      dist.disconnect();
      filter.disconnect();
      vca.disconnect();
    });
  }
}

// ---- Controls companion component ----

/**
 * WebAudioSynthAcidControls — portable control panel for WebAudioSynthAcid.
 *
 * Creates parameter sliders, preset dropdown, SAW/SQR toggle, step sequencer,
 * randomize/note buttons, waveform display, and FX unit.
 *
 * Audio routing: instrument → analyser → fxUnit → controls._out
 *
 * Usage:
 *   const controls = document.createElement("web-audio-synth-acid-controls");
 *   parent.appendChild(controls);
 *   controls.bind(acid, ctx, { fx: { bpm: 128 } });
 *   controls.setScale(29, "Minor");
 *   controls.connect(masterGain);
 *   // On each sequencer tick:
 *   controls.step(index, time, stepDurationSec);
 */
export class WebAudioSynthAcidControls extends HTMLElement {

  static SLIDER_DEFS = [
    { param: "volume",     label: "Vol",        min: 0,     max: 1,     step: 0.01 },
    { param: "cutoff",     label: "Cutoff",     min: 50,    max: 10000, step: 1, scale: "log" },
    { param: "resonance",  label: "Resonance",  min: 0.1,   max: 30,    step: 0.1 },
    { param: "envMod",     label: "Env Mod",    min: 0,     max: 1,     step: 0.01 },
    { param: "decay",      label: "Decay",      min: 0.01,  max: 2,     step: 0.01 },
    { param: "attack",     label: "Attack",     min: 0.001, max: 0.3,   step: 0.001 },
    { param: "distortion", label: "Distortion", min: 0,     max: 1,     step: 0.01 },
    { param: "portamento", label: "Portamento", min: 0,     max: 0.5,   step: 0.001 },
    { param: "unisonVoices", label: "Unison",     min: 1,     max: 4,     step: 1 },
    { param: "unisonDetune", label: "Detune",     min: 0,     max: 50,    step: 1 },
  ];

  static DEFAULT_PATTERN() {
    const notes = [29, 29, 36, 29, 34, 29, 36, 41, 29, 36, 34, 29, 32, 34, 36, 29];
    const active = new Set([0, 2, 4, 6, 7, 9, 11, 12, 14]);
    const accent = new Set([0, 7, 12]);
    return notes.map((note, i) => ({ active: active.has(i), note, accent: accent.has(i) }));
  }

  constructor() {
    super();
    this._instrument = null;
    this._ctx = null;
    this._sliders = {};
    this._presetSelect = null;
    this._fxUnit = null;
    this._out = null;
    this._seq = null;
    this._rootMidi = 29;
    this._scaleName = "Minor";
    this._pendingNote = null;
  }

  bind(instrument, ctx, options = {}) {
    this._instrument = instrument;
    this._ctx = ctx;
    const color = options.color || "#0f0";
    this.innerHTML = "";
    injectControlsCSS();
    this.style.setProperty("--slider-accent", color);
    this.style.setProperty("--fx-accent", color);

    this._muteHandle = createTitleWithMute(this, options.title || "TB-303 Acid", () => this._out);

    // Controls wrapper
    const controls = document.createElement("div");
    controls.className = "wac-controls";
    this.appendChild(controls);

    // SAW / SQR toggle
    const waveRow = document.createElement("div");
    waveRow.className = "wac-wave-row";
    ["sawtooth", "square"].forEach((type) => {
      const btn = document.createElement("button");
      btn.className = "wac-wave-btn";
      btn.textContent = type === "sawtooth" ? "SAW" : "SQR";
      btn.dataset.type = type;
      if (instrument.oscType === type) btn.classList.add("wac-wave-active");
      btn.addEventListener("click", () => {
        instrument.oscType = type;
        waveRow.querySelectorAll(".wac-wave-btn").forEach((b) => b.classList.toggle("wac-wave-active", b.dataset.type === type));
        this._emitChange();
      });
      waveRow.appendChild(btn);
    });
    controls.appendChild(waveRow);

    // Preset dropdown
    this._presetSelect = document.createElement("select");
    this._presetSelect.className = "wac-select";
    Object.keys(WebAudioSynthAcid.PRESETS).forEach((name) => {
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

    // Sliders
    for (const def of WebAudioSynthAcidControls.SLIDER_DEFS) {
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

    // Delegated slider listener
    this.addEventListener("slider-input", (e) => {
      if (!this._instrument) return;
      this._instrument[e.detail.param] = e.detail.value;
      this._emitChange();
    });

    // Action row — randomize + note buttons
    const actionRow = document.createElement("div");
    actionRow.className = "wac-action-row";

    const randBtn = document.createElement("button");
    randBtn.textContent = "⚄ Randomize";
    randBtn.className = "wac-action-btn";
    randBtn.addEventListener("click", () => this.randomize());
    actionRow.appendChild(randBtn);

    const noteBtn = document.createElement("button");
    noteBtn.textContent = "♩ Note [B]";
    noteBtn.className = "wac-action-btn";
    noteBtn.addEventListener("click", () => this.queueRandomNote());
    actionRow.appendChild(noteBtn);

    this.appendChild(actionRow);

    // Step sequencer
    this._seq = document.createElement("web-audio-step-seq");
    const noteOpts = scaleNoteOptions(this._rootMidi, this._scaleName, 24, 60);
    this._seq.init({
      steps: WebAudioSynthAcidControls.DEFAULT_PATTERN(),
      noteOptions: noteOpts,
      accent: true,
      color,
    });
    this.appendChild(this._seq);
    this._seq.addEventListener("step-change", () => this._emitChange());

    // FX unit
    this._fxUnit = document.createElement("web-audio-fx-unit");
    this.appendChild(this._fxUnit);
    this._fxUnit.init(ctx, { title: "Acid FX", bpm: options.fx?.bpm ?? 120, ...options.fx });

    // Waveform
    const waveform = document.createElement("web-audio-waveform");
    this.appendChild(waveform);

    // Audio routing: instrument → analyser → fxUnit → _out
    const analyser = ctx.createAnalyser();
    instrument.connect(analyser);
    analyser.connect(this._fxUnit.input);
    this._out = ctx.createGain();
    this._fxUnit.connect(this._out);
    waveform.init(analyser, color);
  }

  // ---- Sequencer integration ----

  /** Called by the host on each sequencer tick. */
  step(index, time, stepDurationSec) {
    if (!this._instrument || !this._seq) return;
    const steps = this._seq.steps;
    const s = steps[index];
    if (s?.active) {
      this._instrument.trigger(s.note, stepDurationSec, s.accent, time);
    }
    if (this._pendingNote !== null) {
      this._instrument.trigger(this._pendingNote, stepDurationSec, false, time);
      this._pendingNote = null;
    }
  }

  /** Highlight the currently playing step. */
  setActiveStep(i) {
    this._seq?.setActiveStep(i);
  }

  /** Update note options when global scale changes. */
  setScale(rootMidi, scaleName) {
    this._rootMidi = rootMidi;
    this._scaleName = scaleName;
    this._seq?.setNoteOptions(scaleNoteOptions(rootMidi, scaleName, 24, 60));
  }

  /** Queue a random note to be played on the next step. */
  queueRandomNote() {
    const notes = scaleNotesInRange(this._rootMidi, this._scaleName, 24, 60);
    if (notes.length) this._pendingNote = notes[Math.floor(Math.random() * notes.length)];
  }

  /** Randomize the step pattern using weighted probability. */
  randomize() {
    const notes = scaleNotesInRange(this._rootMidi, this._scaleName, 24, 60);
    if (!notes.length) return;
    const root = this._rootMidi;
    const pool = notes.flatMap((n) => {
      const octaveAbove = Math.floor((n - root) / 12);
      const weight = Math.max(1, 4 - octaveAbove * 2) + (n === root || n === root + 12 ? 2 : 0);
      return Array(weight).fill(n);
    });

    let prevNote = root;
    const newSteps = Array.from({ length: 16 }, (_, i) => {
      const active = Math.random() < STEP_WEIGHTS[i];
      const nearby = pool.filter((n) => Math.abs(n - prevNote) <= 7);
      const src = nearby.length >= 3 ? nearby : pool;
      const note = src[Math.floor(Math.random() * src.length)];
      if (active) prevNote = note;
      const accent = [0, 4, 8, 12].includes(i) && Math.random() < 0.4;
      return { active, note, accent };
    });
    newSteps[0] = { active: true, note: root, accent: Math.random() < 0.5 };
    this._seq.steps = newSteps;
    this._emitChange();
  }

  // ---- Serialization ----

  _emitChange() {
    this.dispatchEvent(new CustomEvent("controls-change", { bubbles: true }));
  }

  toJSON() {
    if (!this._instrument) return null;
    const params = {};
    for (const def of WebAudioSynthAcidControls.SLIDER_DEFS) params[def.param] = this._instrument[def.param];
    params.oscType = this._instrument.oscType;
    return {
      params,
      steps: this._seq?.steps ?? [],
      fx: this._fxUnit?.toJSON(),
      muted: this._muteHandle?.isMuted() ?? false,
    };
  }

  fromJSON(obj) {
    if (!obj || !this._instrument) return;
    if (obj.params) {
      for (const [key, val] of Object.entries(obj.params)) {
        if (key === "oscType") {
          this._instrument.oscType = val;
          const waveRow = this.querySelector(".wac-wave-row");
          if (waveRow) waveRow.querySelectorAll(".wac-wave-btn").forEach((b) => b.classList.toggle("wac-wave-active", b.dataset.type === val));
        } else {
          this._instrument[key] = val;
          if (this._sliders[key]) this._sliders[key].value = val;
        }
      }
    }
    if (obj.steps && this._seq) this._seq.steps = obj.steps;
    if (obj.fx) this._fxUnit?.fromJSON(obj.fx);
    if (obj.muted != null) this._muteHandle?.setMuted(obj.muted);
  }

  // ---- Preset / routing ----

  applyPreset(name) {
    if (!this._instrument) return;
    this._instrument.applyPreset(name);
    for (const def of WebAudioSynthAcidControls.SLIDER_DEFS) {
      const slider = this._sliders[def.param];
      if (slider) slider.value = this._instrument[def.param];
    }
    if (this._presetSelect) this._presetSelect.value = name;
    const waveRow = this.querySelector(".wac-wave-row");
    if (waveRow) {
      waveRow.querySelectorAll(".wac-wave-btn").forEach((b) => b.classList.toggle("wac-wave-active", b.dataset.type === this._instrument.oscType));
    }
  }

  set bpm(v) { if (this._fxUnit) this._fxUnit.bpm = v; }

  connect(node) {
    if (this._out) this._out.connect(node.input ?? node);
    return this;
  }
}

customElements.define("web-audio-synth-acid-controls", WebAudioSynthAcidControls);
