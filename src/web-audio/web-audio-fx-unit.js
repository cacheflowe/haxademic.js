/**
 * WebAudioFxUnit — reusable effects web component (reverb + delay + filter).
 *
 * Composed from standalone FX classes:
 *   - WebAudioFxReverb  (convolution reverb with wet/dry)
 *   - WebAudioFxDelay   (dub-style delay with BPM sync, feedback filter, LFO)
 *   - WebAudioFxFilter  (combined HP + LP with shared Q)
 *
 * Audio chain:
 *   in → reverb (dry=1, wet adjustable) → pre_out
 *   in → delay (wet/dry internal)       → pre_out
 *   pre_out → filter (HP → LP)          → out
 *
 * Usage:
 *   const fx = document.createElement("web-audio-fx-unit");
 *   parentEl.appendChild(fx);
 *   fx.init(ctx, { bpm: 128, reverbWet: 0.15, delayInterval: 0.75 });
 *   synth.connect(fx);
 *   fx.connect(ctx.destination);
 *   fx.bpm = 140; // live BPM update
 */

import WebAudioFxReverb from "./web-audio-fx-reverb.js";
import WebAudioFxDelay from "./web-audio-fx-delay.js";
import WebAudioFxFilter from "./web-audio-fx-filter.js";
import "./web-audio-slider.js";

export default class WebAudioFxUnit extends HTMLElement {
  static #cssInjected = false;

  constructor() {
    super();
    this._ctx = null;
    this._in = null;
    this._out = null;
    this._reverb = null;
    this._delay = null;
    this._filter = null;
  }

  /**
   * @param {AudioContext} ctx
   * @param {object} [options]
   * @param {string}  [options.title="FX"]
   * @param {number}  [options.bpm=120]
   * @param {number}  [options.reverbDecay=2.5]
   * @param {number}  [options.reverbWet=0]
   * @param {number}  [options.delayInterval=0.75]   beat multiplier
   * @param {number}  [options.delayFeedback=0.35]
   * @param {number}  [options.delayMix=0]
   * @param {number}  [options.delayFilterFreq=12000]
   * @param {number}  [options.lpFreq=20000]
   * @param {number}  [options.hpFreq=20]
   * @param {number}  [options.filterQ=0.7]
   */
  init(ctx, options = {}) {
    this._ctx = ctx;

    // ---- Audio chain ----
    this._in = ctx.createGain();
    const preOut = ctx.createGain();
    this._out = ctx.createGain();

    // Reverb — dry=1 always, wet adjustable
    this._reverb = new WebAudioFxReverb(ctx, {
      decay: options.reverbDecay ?? 2.5,
      wet: options.reverbWet ?? 0,
    });
    this._in.connect(this._reverb.input);
    this._reverb.connect(preOut);

    // Delay — dub-style with feedback filter + LFO
    this._delay = new WebAudioFxDelay(ctx, {
      interval: options.delayInterval ?? 0.75,
      bpm: options.bpm ?? 120,
      feedback: options.delayFeedback ?? 0.35,
      wet: options.delayMix ?? 0,
      filterFreq: options.delayFilterFreq ?? 12000,
      modulation: 0,
    });
    this._in.connect(this._delay.input);
    this._delay.connect(preOut);

    // Filter — HP → LP on master output
    this._filter = new WebAudioFxFilter(ctx, {
      lpFreq: options.lpFreq ?? 20000,
      hpFreq: options.hpFreq ?? 20,
      q: options.filterQ ?? 0.7,
    });
    preOut.connect(this._filter.input);
    this._filter.connect(this._out);

    // ---- UI ----
    WebAudioFxUnit._injectCSS();
    this._buildUI(options);
  }

  // ---- Properties ----

  set bpm(v) {
    if (this._delay) this._delay.bpm = v;
  }

  // ---- Routing ----

  get input() {
    return this._in;
  }

  connect(node) {
    this._out.connect(node.input ?? node);
    return this;
  }

  // ---- Serialization ----

  toJSON() {
    return {
      reverbWet: this._reverb?.wet ?? 0,
      delayInterval: this._delay?.interval ?? 0.75,
      delayFeedback: this._delay?.feedback ?? 0.35,
      delayMix: this._delay?.wet ?? 0,
      delayFilterFreq: this._delay?.filterFreq ?? 12000,
      delayModulation: this._delay?.modulation ?? 0,
      lpFreq: this._filter?.lpFreq ?? 20000,
      hpFreq: this._filter?.hpFreq ?? 20,
      filterQ: this._filter?.q ?? 0.7,
    };
  }

  fromJSON(obj) {
    if (!obj) return;
    if (obj.reverbWet != null && this._reverb) {
      this._reverb.wet = obj.reverbWet;
      const s = this.querySelector('web-audio-slider[param="reverbWet"]');
      if (s) s.value = obj.reverbWet;
    }
    if (obj.delayInterval != null && this._delay) {
      this._delay.interval = obj.delayInterval;
      const sel = this.querySelector('.fx-select');
      if (sel) sel.value = obj.delayInterval;
    }
    if (obj.delayFeedback != null && this._delay) {
      this._delay.feedback = obj.delayFeedback;
      const s = this.querySelector('web-audio-slider[param="delayFeedback"]');
      if (s) s.value = obj.delayFeedback;
    }
    if (obj.delayMix != null && this._delay) {
      this._delay.wet = obj.delayMix;
      const s = this.querySelector('web-audio-slider[param="delayMix"]');
      if (s) s.value = obj.delayMix;
    }
    if (obj.delayFilterFreq != null && this._delay) {
      this._delay.filterFreq = obj.delayFilterFreq;
      const s = this.querySelector('web-audio-slider[param="delayFilterFreq"]');
      if (s) s.value = obj.delayFilterFreq;
    }
    if (obj.delayModulation != null && this._delay) {
      this._delay.modulation = obj.delayModulation;
      const s = this.querySelector('web-audio-slider[param="delayModulation"]');
      if (s) s.value = obj.delayModulation;
    }
    if (obj.lpFreq != null && this._filter) {
      this._filter.lpFreq = obj.lpFreq;
      const s = this.querySelector('web-audio-slider[param="lpFreq"]');
      if (s) s.value = obj.lpFreq;
    }
    if (obj.hpFreq != null && this._filter) {
      this._filter.hpFreq = obj.hpFreq;
      const s = this.querySelector('web-audio-slider[param="hpFreq"]');
      if (s) s.value = obj.hpFreq;
    }
    if (obj.filterQ != null && this._filter) {
      this._filter.q = obj.filterQ;
      const s = this.querySelector('web-audio-slider[param="filterQ"]');
      if (s) s.value = obj.filterQ;
    }
  }

  // ---- UI ----

  _buildUI(options) {
    this.innerHTML = "";

    const header = document.createElement("div");
    header.className = "fx-unit-header";
    header.textContent = options.title ?? "FX";
    this.appendChild(header);

    // Reverb wet slider
    this._addSlider("reverbWet", "Reverb", 0, 1, 0.01, options.reverbWet ?? 0);

    // Delay interval select
    const intervalWrap = document.createElement("div");
    intervalWrap.className = "fx-ctrl";
    intervalWrap.appendChild(Object.assign(document.createElement("label"), { textContent: "Delay" }));
    const intervalSelect = document.createElement("select");
    intervalSelect.className = "fx-select";
    WebAudioFxDelay.INTERVALS.forEach(({ label, beats }) => {
      const opt = document.createElement("option");
      opt.value = beats;
      opt.textContent = label;
      if (beats === (options.delayInterval ?? 0.75)) opt.selected = true;
      intervalSelect.appendChild(opt);
    });
    intervalSelect.addEventListener("change", () => {
      if (this._delay) this._delay.interval = parseFloat(intervalSelect.value);
    });
    intervalWrap.appendChild(intervalSelect);
    this.appendChild(intervalWrap);

    // Delay sliders
    this._addSlider("delayFeedback", "Feedbk", 0, 0.9, 0.01, options.delayFeedback ?? 0.35);
    this._addSlider("delayMix", "Mix", 0, 1, 0.01, options.delayMix ?? 0);
    this._addSlider("delayFilterFreq", "Filter", 200, 12000, 1, options.delayFilterFreq ?? 12000, { hint: "dub", scale: "log" });
    this._addSlider("delayModulation", "Mod", 0, 1, 0.01, 0);

    // Master filter sliders
    this._addSlider("lpFreq", "LPF", 80, 20000, 1, options.lpFreq ?? 20000, { scale: "log" });
    this._addSlider("hpFreq", "HPF", 20, 8000, 1, options.hpFreq ?? 20, { scale: "log" });
    this._addSlider("filterQ", "Q", 0.5, 15, 0.1, options.filterQ ?? 0.7);

    // Delegated listener for all sliders
    this.addEventListener("slider-input", (e) => {
      const { param, value } = e.detail;
      switch (param) {
        case "reverbWet":       if (this._reverb) this._reverb.wet = value; break;
        case "delayFeedback":   if (this._delay)  this._delay.feedback = value; break;
        case "delayMix":        if (this._delay)  this._delay.wet = value; break;
        case "delayFilterFreq": if (this._delay)  this._delay.filterFreq = value; break;
        case "delayModulation": if (this._delay)  this._delay.modulation = value; break;
        case "lpFreq":          if (this._filter) this._filter.lpFreq = value; break;
        case "hpFreq":          if (this._filter) this._filter.hpFreq = value; break;
        case "filterQ":         if (this._filter) this._filter.q = value; break;
      }
    });
  }

  _addSlider(param, label, min, max, step, value, opts = {}) {
    const slider = document.createElement("web-audio-slider");
    slider.setAttribute("param", param);
    slider.setAttribute("label", label);
    slider.setAttribute("min", min);
    slider.setAttribute("max", max);
    slider.setAttribute("step", step);
    if (opts.hint) slider.setAttribute("hint", opts.hint);
    if (opts.scale) slider.setAttribute("scale", opts.scale);
    slider.value = value;
    this.appendChild(slider);
    return slider;
  }

  // ---- CSS (injected once per page) ----

  static _injectCSS() {
    if (WebAudioFxUnit.#cssInjected) return;
    WebAudioFxUnit.#cssInjected = true;
    const style = document.createElement("style");
    style.textContent = `
      web-audio-fx-unit {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: 10px 18px;
        padding: 10px 14px;
        background: #0d0d0d;
        border-top: 1px solid #1e1e1e;
        font-family: monospace;
        --slider-accent: var(--fx-accent, #0f0);
      }
      .fx-unit-header {
        width: 100%;
        font-size: 0.62em;
        color: #3a3a3a;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        margin-bottom: -4px;
      }
      .fx-ctrl {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 80px;
      }
      .fx-ctrl label {
        font-size: 0.7em;
        color: #555;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .fx-select {
        font-family: monospace;
        font-size: 0.82em;
        background: #1a1a1a;
        color: #aaa;
        border: 1px solid #333;
        border-radius: 3px;
        padding: 4px 5px;
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
  }
}

customElements.define("web-audio-fx-unit", WebAudioFxUnit);
