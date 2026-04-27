import "./web-audio-slider.js";
import { injectControlsCSS } from "./web-audio-slider.js";

/**
 * WebAudioPercKick — 808-style kick via sine oscillator with pitch sweep.
 *
 * A sine starts at a high frequency and rapidly drops to a low thump,
 * while the amplitude decays. Adjust startFreq/endFreq/sweepTime/decay
 * for different flavors (punchy, boomy, snappy).
 *
 * Usage:
 *   const kick = new WebAudioPercKick(ctx);
 *   kick.connect(ctx.destination);
 *   kick.trigger(0.9, time);
 */
export default class WebAudioPercKick {
  static PRESETS = {
    Default: { startFreq: 150, endFreq: 40, sweepTime: 0.08, decay: 0.35, volume: 1 },
    Punchy: { startFreq: 200, endFreq: 50, sweepTime: 0.05, decay: 0.25, volume: 1 },
    Boomy: { startFreq: 100, endFreq: 30, sweepTime: 0.15, decay: 0.6, volume: 0.9 },
    Snap: { startFreq: 300, endFreq: 60, sweepTime: 0.03, decay: 0.18, volume: 1 },
  };

  constructor(ctx, preset = "Default") {
    this.ctx = ctx;
    this._out = ctx.createGain();
    this.applyPreset(preset);
  }

  /**
   * Apply a named preset, updating all synth parameters in place.
   * @param {string} name  Key of WebAudioPercKick.PRESETS
   */
  applyPreset(name) {
    const p = WebAudioPercKick.PRESETS[name];
    if (!p) return;
    if (p.startFreq != null) this.startFreq = p.startFreq;
    if (p.endFreq   != null) this.endFreq   = p.endFreq;
    if (p.sweepTime != null) this.sweepTime = p.sweepTime;
    if (p.decay     != null) this.decay     = p.decay;
    if (p.volume    != null) this.volume    = p.volume;
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
   * @param {number} [velocity]  0–1
   * @param {number} [atTime]    AudioContext time
   */
  trigger(velocity = 1, atTime = 0) {
    const ctx = this.ctx;
    const t = atTime > 0 ? atTime : ctx.currentTime;

    const osc = ctx.createOscillator();
    const amp = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(this.startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, this.endFreq), t + this.sweepTime);

    amp.gain.setValueAtTime(velocity, t);
    amp.gain.exponentialRampToValueAtTime(0.001, t + this.decay);

    osc.connect(amp);
    amp.connect(this._out);

    osc.start(t);
    osc.stop(t + this.decay + 0.05);

    return this;
  }
}

// ---- Controls companion component ----

export class WebAudioPercKickControls extends HTMLElement {

  static SLIDER_DEFS = [
    { param: "startFreq", label: "Start Freq", min: 50,   max: 500,  step: 1 },
    { param: "endFreq",   label: "End Freq",   min: 20,   max: 200,  step: 1 },
    { param: "sweepTime", label: "Sweep",      min: 0.01, max: 0.5,  step: 0.01 },
    { param: "decay",     label: "Decay",      min: 0.05, max: 1.5,  step: 0.01 },
    { param: "volume",    label: "Vol",        min: 0,    max: 1,    step: 0.01 },
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
    const color = options.color || "#f44";
    this.innerHTML = "";
    injectControlsCSS();
    this.style.setProperty("--slider-accent", color);
    this.style.setProperty("--fx-accent", color);

    const title = document.createElement("div");
    title.className = "wac-title";
    title.textContent = options.title || "Kick";
    this.appendChild(title);

    const controls = document.createElement("div");
    controls.className = "wac-controls";
    this.appendChild(controls);

    this._presetSelect = document.createElement("select");
    this._presetSelect.className = "wac-select";
    Object.keys(WebAudioPercKick.PRESETS).forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name.replace(/_/g, " ");
      this._presetSelect.appendChild(opt);
    });
    this._presetSelect.addEventListener("change", () => this.applyPreset(this._presetSelect.value));
    controls.appendChild(this._presetSelect);

    for (const def of WebAudioPercKickControls.SLIDER_DEFS) {
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
    this._fxUnit.init(ctx, { title: "Kick FX", bpm: options.fx?.bpm ?? 120, ...options.fx });

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
    for (const def of WebAudioPercKickControls.SLIDER_DEFS) {
      const slider = this._sliders[def.param];
      if (slider) slider.value = this._instrument[def.param];
    }
    if (this._presetSelect) this._presetSelect.value = name;
  }

  set bpm(v) { if (this._fxUnit) this._fxUnit.bpm = v; }

  connect(node) {
    if (this._out) this._out.connect(node.input ?? node);
    return this;
  }
}

customElements.define("web-audio-perc-kick-controls", WebAudioPercKickControls);
