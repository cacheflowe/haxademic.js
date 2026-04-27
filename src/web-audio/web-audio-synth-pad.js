import "./web-audio-slider.js";
import { injectControlsCSS } from "./web-audio-slider.js";

/**
 * WebAudioSynthPad — polyphonic pad synth for chord stabs.
 *
 * Accepts an array of MIDI notes per trigger. Each note gets its own
 * oscillator + amp envelope; voices are fire-and-forget.
 *
 * Usage:
 *   const pad = new WebAudioSynthPad(ctx, { attack: 0.5, release: 2 });
 *   pad.connect(reverb);
 *   pad.trigger([48, 51, 55], 1.0, 0.7, time); // C minor triad
 */
export default class WebAudioSynthPad {
  static PRESETS = {
    Default: { oscType: "sine", attack: 0.5, decay: 0.4, sustain: 0.7, release: 2.0, volume: 1 },
    Strings: { oscType: "sawtooth", attack: 0.8, decay: 0.5, sustain: 0.8, release: 2.5, volume: 0.7 },
    Warm: { oscType: "triangle", attack: 0.3, decay: 0.3, sustain: 0.9, release: 1.5, volume: 0.9 },
    Stab: { oscType: "sawtooth", attack: 0.01, decay: 0.2, sustain: 0.0, release: 0.4, volume: 0.9 },
  };

  constructor(ctx, preset = "Default") {
    this.ctx = ctx;
    this._out = ctx.createGain();
    this.applyPreset(preset);
  }

  /**
   * Apply a named preset, updating all synth parameters in place.
   * @param {string} name  Key of WebAudioSynthPad.PRESETS
   */
  applyPreset(name) {
    const p = WebAudioSynthPad.PRESETS[name];
    if (!p) return;
    if (p.oscType != null) this.oscType = p.oscType;
    if (p.attack  != null) this.attack  = p.attack;
    if (p.decay   != null) this.decay   = p.decay;
    if (p.sustain != null) this.sustain = p.sustain;
    if (p.release != null) this.release = p.release;
    if (p.volume  != null) this.volume  = p.volume;
  }

  get volume() { return this._out.gain.value; }
  set volume(v) { this._out.gain.value = v; }

  get input() {
    return this._out;
  }

  connect(node) {
    this._out.connect(node.input ?? node);
    return this;
  }

  /**
   * @param {number|number[]} midiNotes  Single MIDI note or chord array
   * @param {number} durationSec
   * @param {number} [velocity]  0–1
   * @param {number} [atTime]    AudioContext time
   */
  trigger(midiNotes, durationSec, velocity = 1, atTime = 0) {
    const ctx = this.ctx;
    const t = atTime > 0 ? atTime : ctx.currentTime;
    const notes = Array.isArray(midiNotes) ? midiNotes : [midiNotes];
    // Constant-power scaling keeps perceived volume stable across chord sizes
    const perVoice = velocity / Math.sqrt(notes.length);

    notes.forEach((midi) => {
      const freq = 440 * Math.pow(2, (midi - 69) / 12);
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();

      osc.type = this.oscType;
      osc.frequency.value = freq;

      amp.gain.setValueAtTime(0, t);
      amp.gain.linearRampToValueAtTime(perVoice, t + this.attack);
      amp.gain.linearRampToValueAtTime(perVoice * this.sustain, t + this.attack + this.decay);
      amp.gain.setValueAtTime(perVoice * this.sustain, t + durationSec);
      amp.gain.linearRampToValueAtTime(0, t + durationSec + this.release);

      osc.connect(amp);
      amp.connect(this._out);

      osc.start(t);
      osc.stop(t + durationSec + this.release + 0.1);
    });

    return this;
  }
}

// ---- Controls companion component ----

export class WebAudioSynthPadControls extends HTMLElement {

  static SLIDER_DEFS = [
    { param: "attack",  label: "Attack",  min: 0.01, max: 2,  step: 0.01 },
    { param: "decay",   label: "Decay",   min: 0.01, max: 2,  step: 0.01 },
    { param: "sustain", label: "Sustain", min: 0,    max: 1,  step: 0.01 },
    { param: "release", label: "Release", min: 0.01, max: 5,  step: 0.01 },
    { param: "volume",  label: "Vol",     min: 0,    max: 1,  step: 0.01 },
  ];

  constructor() {
    super();
    this._instrument = null;
    this._sliders = {};
    this._presetSelect = null;
    this._fxUnit = null;
    this._out = null;
  }

  bind(instrument, ctx, options = {}) {
    this._instrument = instrument;
    const color = options.color || "#88f";
    this.innerHTML = "";
    injectControlsCSS();
    this.style.setProperty("--slider-accent", color);
    this.style.setProperty("--fx-accent", color);

    const title = document.createElement("div");
    title.className = "wac-title";
    title.textContent = options.title || "Pad Synth";
    this.appendChild(title);

    const controls = document.createElement("div");
    controls.className = "wac-controls";
    this.appendChild(controls);

    // Osc type buttons
    const waveRow = document.createElement("div");
    waveRow.className = "wac-wave-row";
    ["sine", "triangle", "sawtooth", "square"].forEach((type) => {
      const btn = document.createElement("button");
      btn.className = "wac-wave-btn";
      btn.textContent = type.slice(0, 3).toUpperCase();
      btn.dataset.type = type;
      if (instrument.oscType === type) btn.classList.add("wac-wave-active");
      btn.addEventListener("click", () => {
        instrument.oscType = type;
        waveRow.querySelectorAll(".wac-wave-btn").forEach((b) => b.classList.toggle("wac-wave-active", b.dataset.type === type));
      });
      waveRow.appendChild(btn);
    });
    controls.appendChild(waveRow);

    // Preset dropdown
    this._presetSelect = document.createElement("select");
    this._presetSelect.className = "wac-select";
    Object.keys(WebAudioSynthPad.PRESETS).forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name.replace(/_/g, " ");
      this._presetSelect.appendChild(opt);
    });
    this._presetSelect.addEventListener("change", () => this.applyPreset(this._presetSelect.value));
    controls.appendChild(this._presetSelect);

    for (const def of WebAudioSynthPadControls.SLIDER_DEFS) {
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

    this.addEventListener("slider-input", (e) => {
      if (!this._instrument) return;
      this._instrument[e.detail.param] = e.detail.value;
    });

    this._fxUnit = document.createElement("web-audio-fx-unit");
    this.appendChild(this._fxUnit);
    this._fxUnit.init(ctx, { title: "Pad FX", bpm: options.fx?.bpm ?? 120, ...options.fx });

    const waveform = document.createElement("web-audio-waveform");
    this.appendChild(waveform);

    const analyser = ctx.createAnalyser();
    instrument.connect(analyser);
    analyser.connect(this._fxUnit.input);
    this._out = ctx.createGain();
    this._fxUnit.connect(this._out);
    waveform.init(analyser, color);
  }

  applyPreset(name) {
    if (!this._instrument) return;
    this._instrument.applyPreset(name);
    for (const def of WebAudioSynthPadControls.SLIDER_DEFS) {
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

customElements.define("web-audio-synth-pad-controls", WebAudioSynthPadControls);
