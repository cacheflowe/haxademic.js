import "./web-audio-slider.js";
import { injectControlsCSS } from "./web-audio-slider.js";

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
    Soft_Bass: {
      oscType: "sawtooth",
      attack: 0.02,
      decay: 0.2,
      sustain: 0.5,
      release: 0.4,
      filterFreq: 500,
      filterQ: 5,
      filterEnvOctaves: 2,
      detune: 0,
      detune2: 0,
      subGain: 0,
      volume: 0.6,
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
    Airy_Lead: {
      oscType: "sawtooth",
      attack: 0.02,
      decay: 0.15,
      sustain: 0.3,
      release: 0.8,
      filterFreq: 4000,
      filterQ: 1,
      filterEnvOctaves: 0,
      detune: 0,
      detune2: 0,
      subGain: 0,
      volume: 0.35,
    },
  };

  constructor(ctx, preset = "Default") {
    this.ctx = ctx;
    this._out = ctx.createGain();
    this.applyPreset(preset);
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
    if (p.volume           != null) this.volume           = p.volume;
  }

  get volume() { return this._out.gain.value; }
  set volume(v) { this._out.gain.value = v; }

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

// ---- Controls companion component ----

export class WebAudioSynthMonoControls extends HTMLElement {

  static SLIDER_DEFS = [
    { param: "attack",          label: "Attack",     min: 0.001, max: 1,    step: 0.001 },
    { param: "decay",           label: "Decay",      min: 0.01,  max: 2,    step: 0.01 },
    { param: "sustain",         label: "Sustain",    min: 0,     max: 1,    step: 0.01 },
    { param: "release",         label: "Release",    min: 0.01,  max: 3,    step: 0.01 },
    { param: "filterFreq",      label: "Filter",     min: 20,    max: 12000,step: 1, scale: "log" },
    { param: "filterQ",         label: "Filter Q",   min: 0.5,   max: 20,   step: 0.1 },
    { param: "filterEnvOctaves",label: "Filt Env",   min: 0,     max: 6,    step: 0.1 },
    { param: "detune",          label: "Detune",     min: -50,   max: 50,   step: 1 },
    { param: "detune2",         label: "Spread",     min: 0,     max: 50,   step: 1 },
    { param: "subGain",         label: "Sub",        min: 0,     max: 1,    step: 0.01 },
    { param: "volume",          label: "Vol",        min: 0,     max: 1,    step: 0.01 },
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
    const color = options.color || "#0f0";
    this.innerHTML = "";
    injectControlsCSS();
    this.style.setProperty("--slider-accent", color);
    this.style.setProperty("--fx-accent", color);

    const title = document.createElement("div");
    title.className = "wac-title";
    title.textContent = options.title || "Mono Synth";
    this.appendChild(title);

    const controls = document.createElement("div");
    controls.className = "wac-controls";
    this.appendChild(controls);

    // Osc type buttons
    const waveRow = document.createElement("div");
    waveRow.className = "wac-wave-row";
    ["sawtooth", "square", "triangle", "sine"].forEach((type) => {
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
    Object.keys(WebAudioSynthMono.PRESETS).forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name.replace(/_/g, " ");
      this._presetSelect.appendChild(opt);
    });
    this._presetSelect.addEventListener("change", () => this.applyPreset(this._presetSelect.value));
    controls.appendChild(this._presetSelect);

    for (const def of WebAudioSynthMonoControls.SLIDER_DEFS) {
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
    this._fxUnit.init(ctx, { title: "Mono FX", bpm: options.fx?.bpm ?? 120, ...options.fx });

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
    for (const def of WebAudioSynthMonoControls.SLIDER_DEFS) {
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

customElements.define("web-audio-synth-mono-controls", WebAudioSynthMonoControls);
