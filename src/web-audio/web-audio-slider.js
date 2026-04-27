/**
 * WebAudioSlider — shared range-input web component for audio parameter controls.
 *
 * Light DOM, CSS injected once. Dispatches `slider-input` events on user
 * interaction; programmatic `.value` updates the display silently (no event).
 *
 * Usage:
 *   <web-audio-slider label="Cutoff" param="cutoff"
 *     min="50" max="10000" step="1" value="600"></web-audio-slider>
 *
 * Logarithmic scale (ideal for frequency controls):
 *   <web-audio-slider label="LPF" param="lpFreq"
 *     min="80" max="20000" step="1" scale="log" value="20000"></web-audio-slider>
 *
 * Color theming (in priority order):
 *   1. `color` attribute on the element
 *   2. `--slider-accent` CSS custom property from parent
 *   3. Default #0f0
 *
 * Events:
 *   slider-input  { param: string, value: number }  — bubbles, user-only
 */
export default class WebAudioSlider extends HTMLElement {
  static #cssInjected = false;

  constructor() {
    super();
    this._range = null;
    this._valEl = null;
    this._built = false;
  }

  connectedCallback() {
    WebAudioSlider._injectCSS();
    if (!this._built) this._build();
  }

  // ---- Observed attributes ----

  static get observedAttributes() {
    return ["label", "param", "min", "max", "step", "value", "color", "hint", "scale"];
  }

  attributeChangedCallback(name, _old, val) {
    if (!this._built) return;
    if (name === "value") {
      const num = parseFloat(val);
      this._setDisplayValue(num);
      if (this._range) this._range.value = this._isLog ? this._toSlider(num) : num;
    } else if (name === "label") {
      const lbl = this.querySelector(".was-label-text");
      if (lbl) lbl.textContent = val + " ";
    } else if (name === "min" || name === "max" || name === "step") {
      if (!this._isLog && this._range) this._range[name] = val;
    } else if (name === "color") {
      this.style.setProperty("--slider-accent", val);
    } else if (name === "hint") {
      let hintEl = this.querySelector(".was-hint");
      if (val) {
        if (!hintEl) {
          hintEl = document.createElement("span");
          hintEl.className = "was-hint";
          const top = this.querySelector(".was-top");
          if (top) top.appendChild(hintEl);
        }
        hintEl.textContent = val;
      } else if (hintEl) {
        hintEl.remove();
      }
    }
  }

  // ---- Value property (programmatic set = no event) ----

  get value() {
    if (!this._range) return parseFloat(this.getAttribute("value") || 0);
    return this._isLog ? this._fromSlider(parseFloat(this._range.value)) : parseFloat(this._range.value);
  }

  set value(v) {
    const num = typeof v === "number" ? v : parseFloat(v);
    if (this._range) this._range.value = this._isLog ? this._toSlider(num) : num;
    this._setDisplayValue(num);
    this.setAttribute("value", num);
  }

  // ---- Build ----

  _build() {
    this._built = true;
    this.innerHTML = "";

    const label = this.getAttribute("label") || "";
    const param = this.getAttribute("param") || "";
    const min = this.getAttribute("min") || "0";
    const max = this.getAttribute("max") || "1";
    const step = this.getAttribute("step") || "0.01";
    const value = this.getAttribute("value") || min;
    const color = this.getAttribute("color");
    const hint = this.getAttribute("hint");
    this._isLog = this.getAttribute("scale") === "log";
    this._logMin = parseFloat(min);
    this._logMax = parseFloat(max);

    if (color) this.style.setProperty("--slider-accent", color);

    // Top row: label + value + optional hint
    const top = document.createElement("div");
    top.className = "was-top";

    const lbl = document.createElement("label");
    lbl.className = "was-label";
    const labelText = document.createElement("span");
    labelText.className = "was-label-text";
    labelText.textContent = label + " ";
    this._valEl = document.createElement("span");
    this._valEl.className = "was-val";
    lbl.appendChild(labelText);
    lbl.appendChild(this._valEl);
    top.appendChild(lbl);

    if (hint) {
      const hintEl = document.createElement("span");
      hintEl.className = "was-hint";
      hintEl.textContent = hint;
      top.appendChild(hintEl);
    }

    this.appendChild(top);

    // Range input — log sliders use 0–1 normalized, linear sliders use real min/max
    this._range = document.createElement("input");
    this._range.type = "range";
    this._range.className = "was-range";
    if (this._isLog) {
      this._range.min = 0;
      this._range.max = 1;
      this._range.step = 0.001;
      this._range.value = this._toSlider(parseFloat(value));
    } else {
      this._range.min = min;
      this._range.max = max;
      this._range.step = step;
      this._range.value = value;
    }
    this.appendChild(this._range);

    this._setDisplayValue(parseFloat(value));

    // User interaction only — dispatches slider-input event
    this._range.addEventListener("input", () => {
      const raw = parseFloat(this._range.value);
      const v = this._isLog ? this._fromSlider(raw) : raw;
      this._setDisplayValue(v);
      this.setAttribute("value", v);
      this.dispatchEvent(
        new CustomEvent("slider-input", {
          bubbles: true,
          detail: { param, value: v },
        }),
      );
    });
  }

  // ---- Log scale helpers ----
  // Map between real value (min..max) and normalized slider position (0..1)
  // using exponential curve: value = min * (max/min)^position

  _toSlider(realValue) {
    const lo = Math.max(this._logMin, 1e-6); // avoid log(0)
    const hi = this._logMax;
    return Math.log(realValue / lo) / Math.log(hi / lo);
  }

  _fromSlider(position) {
    const lo = Math.max(this._logMin, 1e-6);
    const hi = this._logMax;
    const step = parseFloat(this.getAttribute("step") || "1");
    const raw = lo * Math.pow(hi / lo, position);
    // Snap to step
    return Math.round(raw / step) * step;
  }

  // ---- Display formatting ----

  _setDisplayValue(v) {
    if (!this._valEl) return;
    const step = parseFloat(this.getAttribute("step") || "0.01");
    if (step < 0.01) this._valEl.textContent = v.toFixed(3);
    else if (step < 1) this._valEl.textContent = v.toFixed(2);
    else this._valEl.textContent = Math.round(v);
  }

  // ---- CSS (injected once) ----

  static _injectCSS() {
    if (WebAudioSlider.#cssInjected) return;
    WebAudioSlider.#cssInjected = true;
    const s = document.createElement("style");
    s.textContent = `
      web-audio-slider {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 80px;
        font-family: monospace;
      }
      .was-top {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 6px;
      }
      .was-label {
        font-size: 0.7em;
        color: #555;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .was-val {
        color: var(--slider-accent, #0f0);
        font-family: monospace;
      }
      .was-hint {
        font-size: 0.6em;
        color: #444;
        white-space: nowrap;
      }
      .was-range {
        width: 100%;
        accent-color: var(--slider-accent, #0f0);
      }
    `;
    document.head.appendChild(s);
  }
}

customElements.define("web-audio-slider", WebAudioSlider);

// ---- Shared CSS for instrument controls components ----

let _controlsCSSInjected = false;

/**
 * Inject shared CSS for `<web-audio-*-controls>` components.
 * Call from any controls component's bind() — only injects once.
 */
export function injectControlsCSS() {
  if (_controlsCSSInjected) return;
  _controlsCSSInjected = true;
  const s = document.createElement("style");
  s.textContent = `
    web-audio-synth-acid-controls,
    web-audio-synth-808-controls,
    web-audio-synth-fm-controls,
    web-audio-synth-blipfx-controls,
    web-audio-synth-mono-controls,
    web-audio-synth-pad-controls,
    web-audio-perc-kick-controls,
    web-audio-perc-hihat-controls,
    web-audio-break-player-controls {
      display: block;
      background: #141414;
      border: 1px solid #222;
      border-radius: 6px;
      overflow: hidden;
      font-family: monospace;
    }
    .wac-title {
      font-size: 0.7em;
      color: var(--slider-accent, #555);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding: 10px 14px 0;
      opacity: 0.6;
    }
    .wac-controls {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 14px;
      padding: 10px 14px;
    }
    .wac-wave-row {
      display: flex;
      gap: 6px;
      width: 100%;
    }
    .wac-wave-btn {
      font-family: monospace;
      font-size: 0.78em;
      padding: 4px 10px;
      background: #1a1a1a;
      color: #666;
      border: 1px solid #333;
      border-radius: 4px;
      cursor: pointer;
    }
    .wac-wave-btn.wac-wave-active {
      color: var(--slider-accent, #0f0);
      border-color: var(--slider-accent, #0f0);
    }
    .wac-select {
      font-family: monospace;
      font-size: 0.82em;
      background: #1a1a1a;
      color: #aaa;
      border: 1px solid #333;
      border-radius: 3px;
      padding: 4px 5px;
      cursor: pointer;
    }
    .wac-action-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-top: 1px solid #1e1e1e;
    }
    .wac-action-btn {
      font-family: monospace;
      font-size: 0.85em;
      padding: 5px 12px;
      background: color-mix(in srgb, var(--slider-accent, #0f0) 10%, #111);
      color: var(--slider-accent, #0f0);
      border: 1px solid var(--slider-accent, #0f0);
      border-radius: 4px;
      cursor: pointer;
      white-space: nowrap;
    }
    .wac-action-btn:hover {
      background: var(--slider-accent, #0f0);
      color: #000;
    }
    .wac-ctrl {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 110px;
    }
    .wac-ctrl-wide { min-width: 220px; }
    .wac-ctrl label {
      font-size: 0.72em;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .wac-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px 0;
    }
    .wac-title-row .wac-title {
      padding: 0;
    }
    .wac-mute-btn {
      font-family: monospace;
      font-size: 0.7em;
      padding: 3px 10px;
      background: transparent;
      color: #555;
      border: 1px solid #333;
      border-radius: 3px;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .wac-mute-btn.wac-muted {
      background: #a00;
      color: #fff;
      border-color: #a00;
    }
  `;
  document.head.appendChild(s);
}

/**
 * Create a mute toggle button for an instrument controls panel.
 * Operates on the controls component's _out gain node.
 *
 * @param {HTMLElement} parentEl  Container element to append the title row to
 * @param {string} titleText     Title text for the instrument
 * @param {function} getOutGain  Getter that returns the _out GainNode (may be null during init)
 * @returns {{ el: HTMLElement, isMuted: () => boolean, setMuted: (v: boolean) => void }}
 */
export function createTitleWithMute(parentEl, titleText, getOutGain) {
  const row = document.createElement("div");
  row.className = "wac-title-row";

  const title = document.createElement("div");
  title.className = "wac-title";
  title.textContent = titleText;
  row.appendChild(title);

  const muteBtn = document.createElement("button");
  muteBtn.className = "wac-mute-btn";
  muteBtn.textContent = "Mute";
  row.appendChild(muteBtn);

  let muted = false;
  let preMuteVolume = 1;

  muteBtn.addEventListener("click", () => {
    muted = !muted;
    const out = getOutGain();
    if (muted) {
      preMuteVolume = out?.gain.value ?? 1;
      if (out) out.gain.value = 0;
    } else {
      if (out) out.gain.value = preMuteVolume;
    }
    muteBtn.classList.toggle("wac-muted", muted);
    muteBtn.textContent = muted ? "Muted" : "Mute";
    parentEl.dispatchEvent(new CustomEvent("controls-change", { bubbles: true }));
  });

  parentEl.appendChild(row);

  return {
    el: row,
    isMuted: () => muted,
    setMuted: (v) => {
      muted = !!v;
      const out = getOutGain();
      if (muted) {
        preMuteVolume = out?.gain.value ?? 1;
        if (out) out.gain.value = 0;
      }
      muteBtn.classList.toggle("wac-muted", muted);
      muteBtn.textContent = muted ? "Muted" : "Mute";
    },
  };
}
