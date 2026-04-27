/**
 * WebAudioTimeStretch — real-time granular time-stretching and pitch-shifting.
 *
 * Wraps an AudioWorkletNode running a granular overlap-add processor.
 * Feed it an AudioBuffer, then control speed (without pitch change) and
 * pitch (without speed change) independently via AudioParams.
 *
 * Usage:
 *   const ts = new WebAudioTimeStretch(ctx);
 *   await ts.ready;
 *   ts.setBuffer(audioBuffer);
 *   ts.loop = true;
 *   ts.connect(ctx.destination);
 *   ts.play();
 *   ts.timeStretch = 1.5;  // 50% faster, same pitch
 *   ts.pitchShift = -3;    // 3 semitones down, same speed
 *   ts.seek(0.5);          // jump to 50% through buffer
 */

import "./web-audio-slider.js";
import { injectControlsCSS } from "./web-audio-slider.js";

export default class WebAudioTimeStretch {
  /**
   * @param {AudioContext} ctx
   * @param {object} [options]
   * @param {number} [options.volume=1.0]
   */
  constructor(ctx, options = {}) {
    this.ctx = ctx;
    this._node = null;
    this._ready = false;
    this._pendingBuffer = null;
    this._pendingMessages = [];

    this._out = ctx.createGain();
    this._out.gain.value = options.volume ?? 1.0;

    /** Fired when buffer reaches end in non-looping mode. */
    this.onended = null;

    this._initPromise = this._init();
  }

  async _init() {
    const url = new URL("./web-audio-time-stretch.worklet.js", import.meta.url);
    await this.ctx.audioWorklet.addModule(url);

    this._node = new AudioWorkletNode(this.ctx, "time-stretch-processor", {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      processorOptions: {
        sampleRate: this.ctx.sampleRate,
      },
    });
    this._node.connect(this._out);

    this._node.port.onmessage = (e) => {
      if (e.data.type === "ended") {
        this.onended?.();
      }
    };

    this._ready = true;

    // Flush anything queued before the worklet was ready
    if (this._pendingBuffer) {
      this._sendBuffer(this._pendingBuffer);
      this._pendingBuffer = null;
    }
    for (const msg of this._pendingMessages) {
      this._node.port.postMessage(msg);
    }
    this._pendingMessages = [];
  }

  // ---- Ready ----

  /** Resolves when the AudioWorklet module is loaded and the node is created. */
  get ready() {
    return this._initPromise;
  }

  // ---- Buffer ----

  /**
   * Load an AudioBuffer into the processor. Copies channel data and transfers
   * ownership to the worklet thread (zero-copy on the audio side).
   * @param {AudioBuffer} audioBuffer
   */
  setBuffer(audioBuffer) {
    if (!this._ready) {
      this._pendingBuffer = audioBuffer;
      return;
    }
    this._sendBuffer(audioBuffer);
  }

  _sendBuffer(audioBuffer) {
    const channels = [];
    const transferList = [];
    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
      const copy = audioBuffer.getChannelData(ch).slice();
      channels.push(copy);
      transferList.push(copy.buffer);
    }
    this._node.port.postMessage({ type: "setBuffer", channels }, transferList);
  }

  // ---- Transport ----

  play() {
    this._postOrQueue({ type: "play" });
  }

  stop() {
    this._postOrQueue({ type: "stop" });
  }

  /**
   * Jump the read pointer to a normalized position in the buffer.
   * @param {number} normalizedOffset  0..1 position (0 = start, 1 = end)
   */
  seek(normalizedOffset) {
    this._postOrQueue({ type: "seek", offset: normalizedOffset });
  }

  set loop(v) {
    this._postOrQueue({ type: "loop", value: !!v });
  }

  _postOrQueue(msg) {
    if (this._ready) {
      this._node.port.postMessage(msg);
    } else {
      this._pendingMessages.push(msg);
    }
  }

  // ---- AudioParam accessors ----

  get timeStretch() {
    return this._node?.parameters.get("timeStretch")?.value ?? 1.0;
  }
  set timeStretch(v) {
    const param = this._node?.parameters.get("timeStretch");
    if (param) param.setValueAtTime(v, this.ctx.currentTime);
  }

  get pitchShift() {
    return this._node?.parameters.get("pitchShift")?.value ?? 0;
  }
  set pitchShift(v) {
    const param = this._node?.parameters.get("pitchShift");
    if (param) param.setValueAtTime(v, this.ctx.currentTime);
  }

  get grainSize() {
    return this._node?.parameters.get("grainSize")?.value ?? 0.06;
  }
  set grainSize(v) {
    const param = this._node?.parameters.get("grainSize");
    if (param) param.setValueAtTime(v, this.ctx.currentTime);
  }

  // ---- Routing ----

  get volume() {
    return this._out.gain.value;
  }
  set volume(v) {
    this._out.gain.value = v;
  }

  get input() {
    return this._out;
  }

  connect(node) {
    this._out.connect(node.input ?? node);
    return this;
  }
}

// ---- Controls companion component ----

const STRETCH_RATIOS = [
  { label: "×0.5", value: 0.5 },
  { label: "×1", value: 1 },
  { label: "×2", value: 2 },
];

const GRAIN_STYLES = [
  { label: "Clean", value: "clean" },
  { label: "Vintage", value: "vintage" },
];

/**
 * WebAudioTimeStretchControls — reusable pitch / time-stretch control panel.
 *
 * A web component that provides UI for pitchShift (semitones, -24 to +24)
 * and stretchRatio (×0.5/×1/×2). Binds to any object with `pitchShift` and
 * `stretchRatio` property setters — it writes directly to the target object.
 *
 * Used by WebAudioBreakPlayerControls when the break player has useTimeStretch
 * enabled. The break player's property setters handle the actual audio routing:
 *   - pitchShift → updates the PitchShiftNode AudioParam (with stretchRatio compensation)
 *   - stretchRatio → changes BufferSourceNode playbackRate on next trigger
 *
 * Supports toJSON/fromJSON for state persistence (localStorage, URL hash sharing).
 *
 * Usage:
 *   const tsControls = document.createElement("web-audio-time-stretch-controls");
 *   parent.appendChild(tsControls);
 *   tsControls.init(breakPlayer);           // target with pitchShift / stretchRatio
 *   tsControls.init(breakPlayer, { title: "Pitch / Time", color: "#0cc" });
 *
 *   // Serialization
 *   const state = tsControls.toJSON();      // { pitchShift, stretchRatio }
 *   tsControls.fromJSON(state);
 */
export class WebAudioTimeStretchControls extends HTMLElement {
  constructor() {
    super();
    this._target = null;
    this._pitchSlider = null;
    this._stretchSelect = null;
    this._styleSelect = null;
  }

  /**
   * @param {object} target  Object with pitchShift / stretchRatio setters
   * @param {object} [options]
   * @param {string} [options.title="Pitch / Time"]
   * @param {string} [options.color]
   */
  init(target, options = {}) {
    this._target = target;
    const color = options.color || "var(--fx-accent, #0cc)";
    this.innerHTML = "";
    injectControlsCSS();
    this.style.setProperty("--slider-accent", color);

    const title = document.createElement("div");
    title.className = "wac-title";
    title.textContent = options.title || "Pitch / Time";
    this.appendChild(title);

    const controls = document.createElement("div");
    controls.className = "wac-controls";
    this.appendChild(controls);

    // Pitch slider
    const pitchSlider = document.createElement("web-audio-slider");
    pitchSlider.setAttribute("param", "pitchShift");
    pitchSlider.setAttribute("label", "Pitch");
    pitchSlider.setAttribute("min", -24);
    pitchSlider.setAttribute("max", 24);
    pitchSlider.setAttribute("step", 0.1);
    pitchSlider.value = target.pitchShift ?? 0;
    controls.appendChild(pitchSlider);
    this._pitchSlider = pitchSlider;

    // Time stretch ratio select
    const stretchWrap = document.createElement("div");
    stretchWrap.className = "wac-ctrl";
    stretchWrap.appendChild(Object.assign(document.createElement("label"), { textContent: "Time" }));
    const stretchSelect = document.createElement("select");
    stretchSelect.className = "wac-select";
    this._stretchSelect = stretchSelect;
    for (const { label, value } of STRETCH_RATIOS) {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      if (value === (target.stretchRatio ?? 1)) opt.selected = true;
      stretchSelect.appendChild(opt);
    }
    stretchSelect.addEventListener("change", () => {
      this._target.stretchRatio = parseFloat(stretchSelect.value);
      this._emitChange();
    });
    stretchWrap.appendChild(stretchSelect);
    controls.appendChild(stretchWrap);

    // Grain style select (clean vs vintage)
    const styleWrap = document.createElement("div");
    styleWrap.className = "wac-ctrl";
    styleWrap.appendChild(Object.assign(document.createElement("label"), { textContent: "Style" }));
    const styleSelect = document.createElement("select");
    styleSelect.className = "wac-select";
    this._styleSelect = styleSelect;
    for (const { label, value } of GRAIN_STYLES) {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      if (value === (target.grainStyle ?? "clean")) opt.selected = true;
      styleSelect.appendChild(opt);
    }
    styleSelect.addEventListener("change", () => {
      this._target.grainStyle = styleSelect.value;
      this._emitChange();
    });
    styleWrap.appendChild(styleSelect);
    controls.appendChild(styleWrap);

    // Slider event delegation
    this.addEventListener("slider-input", (e) => {
      if (!this._target || e.detail.param !== "pitchShift") return;
      this._target.pitchShift = e.detail.value;
      this._emitChange();
    });
  }

  // ---- Events ----

  _emitChange() {
    this.dispatchEvent(new CustomEvent("controls-change", { bubbles: true }));
  }

  // ---- Serialization ----

  toJSON() {
    if (!this._target) return null;
    return {
      pitchShift: this._target.pitchShift ?? 0,
      stretchRatio: this._target.stretchRatio ?? 1,
      grainStyle: this._target.grainStyle ?? "clean",
    };
  }

  fromJSON(obj) {
    if (!obj || !this._target) return;
    if (obj.pitchShift != null) {
      this._target.pitchShift = obj.pitchShift;
      if (this._pitchSlider) this._pitchSlider.value = obj.pitchShift;
    }
    if (obj.stretchRatio != null) {
      this._target.stretchRatio = obj.stretchRatio;
      if (this._stretchSelect) this._stretchSelect.value = obj.stretchRatio;
    }
    if (obj.grainStyle != null) {
      this._target.grainStyle = obj.grainStyle;
      if (this._styleSelect) this._styleSelect.value = obj.grainStyle;
    }
  }
}

customElements.define("web-audio-time-stretch-controls", WebAudioTimeStretchControls);
