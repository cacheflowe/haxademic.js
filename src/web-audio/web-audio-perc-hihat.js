import "./web-audio-slider.js";
import { injectControlsCSS } from "./web-audio-slider.js";

/**
 * WebAudioPercHihat — bandpass-filtered white noise with fast amplitude decay.
 *
 * A pre-generated noise buffer is reused across all triggers for efficiency.
 * Adjust filterFreq/filterQ for open vs closed character, decay for length.
 *
 * Usage:
 *   const hihat = new WebAudioPercHihat(ctx, { decay: 0.04 }); // tight closed hat
 *   hihat.connect(ctx.destination);
 *   hihat.trigger(0.6, time);
 */
export default class WebAudioPercHihat {
  static PRESETS = {
    Default: { filterFreq: 8000, filterQ: 0.8, decay: 0.06, volume: 1 },
    Open: { filterFreq: 7000, filterQ: 0.6, decay: 0.3, volume: 0.8 },
    Tight: { filterFreq: 9000, filterQ: 1.2, decay: 0.03, volume: 1 },
    Shaker: { filterFreq: 6000, filterQ: 0.5, decay: 0.12, volume: 0.7 },
  };

  constructor(ctx, preset = "Default") {
    this.ctx = ctx;
    this._noiseBuffer = this._buildNoiseBuffer();
    this._out = ctx.createGain();
    this.applyPreset(preset);
  }

  _buildNoiseBuffer() {
    const ctx = this.ctx;
    // Half-second of mono white noise, reused across all triggers
    const length = Math.floor(ctx.sampleRate * 0.5);
    const buf = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  /**
   * Apply a named preset, updating all synth parameters in place.
   * @param {string} name  Key of WebAudioPercHihat.PRESETS
   */
  applyPreset(name) {
    const p = WebAudioPercHihat.PRESETS[name];
    if (!p) return;
    if (p.filterFreq != null) this.filterFreq = p.filterFreq;
    if (p.filterQ    != null) this.filterQ    = p.filterQ;
    if (p.decay      != null) this.decay      = p.decay;
    if (p.volume     != null) this.volume     = p.volume;
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

    const noise = ctx.createBufferSource();
    noise.buffer = this._noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = this.filterFreq;
    filter.Q.value = this.filterQ;

    const amp = ctx.createGain();
    amp.gain.setValueAtTime(velocity, t);
    amp.gain.exponentialRampToValueAtTime(0.001, t + this.decay);

    noise.connect(filter);
    filter.connect(amp);
    amp.connect(this._out);

    noise.start(t);
    noise.stop(t + this.decay + 0.05);

    return this;
  }
}

// ---- Controls companion component ----

export class WebAudioPercHihatControls extends HTMLElement {

  static SLIDER_DEFS = [
    { param: "filterFreq", label: "Freq",  min: 2000, max: 16000, step: 1, scale: "log" },
    { param: "filterQ",    label: "Q",     min: 0.1,  max: 5,     step: 0.1 },
    { param: "decay",      label: "Decay", min: 0.01, max: 0.5,   step: 0.01 },
    { param: "volume",     label: "Vol",   min: 0,    max: 1,     step: 0.01 },
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
    const color = options.color || "#ff0";
    this.innerHTML = "";
    injectControlsCSS();
    this.style.setProperty("--slider-accent", color);
    this.style.setProperty("--fx-accent", color);

    const title = document.createElement("div");
    title.className = "wac-title";
    title.textContent = options.title || "Hi-Hat";
    this.appendChild(title);

    const controls = document.createElement("div");
    controls.className = "wac-controls";
    this.appendChild(controls);

    this._presetSelect = document.createElement("select");
    this._presetSelect.className = "wac-select";
    Object.keys(WebAudioPercHihat.PRESETS).forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name.replace(/_/g, " ");
      this._presetSelect.appendChild(opt);
    });
    this._presetSelect.addEventListener("change", () => this.applyPreset(this._presetSelect.value));
    controls.appendChild(this._presetSelect);

    for (const def of WebAudioPercHihatControls.SLIDER_DEFS) {
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
    this._fxUnit.init(ctx, { title: "HiHat FX", bpm: options.fx?.bpm ?? 120, ...options.fx });

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
    for (const def of WebAudioPercHihatControls.SLIDER_DEFS) {
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

customElements.define("web-audio-perc-hihat-controls", WebAudioPercHihatControls);
