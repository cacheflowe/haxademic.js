/**
 * WebAudioFxUnit — reusable effects web component (reverb + tempo-synced delay).
 *
 * Each instrument gets its own fx unit. Color theme is set via the CSS custom
 * property `--fx-accent` on a parent element (defaults to green).
 *
 * Audio chain:
 *   input → reverb (dry=1 always, wet adjustable) → output
 *   input → delay → feedback loop → delay wet gain → output
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

const DELAY_INTERVALS = [
  { label: "1/16", beats: 0.25 },
  { label: "1/8", beats: 0.5 },
  { label: "1/8·", beats: 0.75 },
  { label: "1/4", beats: 1 },
  { label: "1/4·", beats: 1.5 },
  { label: "1/2", beats: 2 },
];

export default class WebAudioFxUnit extends HTMLElement {
  static #cssInjected = false;

  constructor() {
    super();
    this._ctx = null;
    this._in = null;
    this._out = null;
    this._reverb = null;
    this._delayNode = null;
    this._delayFeedback = null;
    this._delayWet = null;
    this._bpm = 120;
    this._delayInterval = 0.75;
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
   */
  init(ctx, options = {}) {
    this._ctx = ctx;
    this._bpm = options.bpm ?? 120;
    this._delayInterval = options.delayInterval ?? 0.75;

    // ---- Audio chain ----
    this._in = ctx.createGain();
    this._out = ctx.createGain();

    // Reverb — WebAudioFxReverb provides dry=1 internally
    this._reverb = new WebAudioFxReverb(ctx, {
      decay: options.reverbDecay ?? 2.5,
      wet: options.reverbWet ?? 0,
    });
    this._in.connect(this._reverb.input);
    this._reverb.connect(this._out);

    // Delay send
    this._delayNode = ctx.createDelay(2.0);
    this._delayFeedback = ctx.createGain();
    this._delayWet = ctx.createGain();
    this._delayNode.delayTime.value = this._computeDelayTime();
    this._delayFeedback.gain.value = options.delayFeedback ?? 0.35;
    this._delayWet.gain.value = options.delayMix ?? 0;
    this._delayNode.connect(this._delayFeedback);
    this._delayFeedback.connect(this._delayNode);
    this._delayNode.connect(this._delayWet);
    this._delayWet.connect(this._out);
    this._in.connect(this._delayNode);

    // ---- UI ----
    WebAudioFxUnit._injectCSS();
    this._buildUI(options);
  }

  // ---- Properties ----

  set bpm(v) {
    this._bpm = v;
    if (this._delayNode) this._delayNode.delayTime.value = this._computeDelayTime();
  }

  _computeDelayTime() {
    return (60 / this._bpm) * this._delayInterval;
  }

  // ---- Routing ----

  get input() {
    return this._in;
  }

  connect(node) {
    this._out.connect(node.input ?? node);
    return this;
  }

  // ---- UI ----

  _buildUI(options) {
    this.innerHTML = "";

    const header = document.createElement("div");
    header.className = "fx-unit-header";
    header.textContent = options.title ?? "FX";
    this.appendChild(header);

    this.appendChild(
      this._makeSlider("Reverb", options.reverbWet ?? 0, 0, 1, 0.01, (v) => {
        if (this._reverb) this._reverb.wet = v;
      }),
    );

    // Delay interval select
    const intervalWrap = document.createElement("div");
    intervalWrap.className = "fx-ctrl";
    intervalWrap.appendChild(Object.assign(document.createElement("label"), { textContent: "Delay" }));
    const intervalSelect = document.createElement("select");
    intervalSelect.className = "fx-select";
    DELAY_INTERVALS.forEach(({ label, beats }) => {
      const opt = document.createElement("option");
      opt.value = beats;
      opt.textContent = label;
      if (beats === this._delayInterval) opt.selected = true;
      intervalSelect.appendChild(opt);
    });
    intervalSelect.addEventListener("change", () => {
      this._delayInterval = parseFloat(intervalSelect.value);
      if (this._delayNode) this._delayNode.delayTime.value = this._computeDelayTime();
    });
    intervalWrap.appendChild(intervalSelect);
    this.appendChild(intervalWrap);

    this.appendChild(
      this._makeSlider("Feedbk", options.delayFeedback ?? 0.35, 0, 0.9, 0.01, (v) => {
        if (this._delayFeedback) this._delayFeedback.gain.value = v;
      }),
    );

    this.appendChild(
      this._makeSlider("Mix", options.delayMix ?? 0, 0, 1, 0.01, (v) => {
        if (this._delayWet) this._delayWet.gain.value = v;
      }),
    );
  }

  _makeSlider(label, value, min, max, step, onChange) {
    const wrap = document.createElement("div");
    wrap.className = "fx-ctrl";

    const lbl = document.createElement("label");
    const valSpan = document.createElement("span");
    valSpan.className = "fx-val";
    valSpan.textContent = value.toFixed(2);
    lbl.textContent = `${label} `;
    lbl.appendChild(valSpan);

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = value;
    slider.addEventListener("input", () => {
      const v = parseFloat(slider.value);
      valSpan.textContent = v.toFixed(2);
      onChange(v);
    });

    wrap.appendChild(lbl);
    wrap.appendChild(slider);
    return wrap;
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
      .fx-val { color: var(--fx-accent, #0f0); }
      .fx-ctrl input[type=range] {
        accent-color: var(--fx-accent, #0f0);
        width: 100%;
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
