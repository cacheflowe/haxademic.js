import "./web-audio-slider.js";
import { injectControlsCSS, createTitleWithMute } from "./web-audio-slider.js";
import "./web-audio-fx-unit.js";
import "./web-audio-waveform.js";
import "./web-audio-time-stretch.js";

/**
 * WebAudioBreakPlayer — loads a drum loop, time-stretches it to the target
 * BPM, and plays it continuously with optional random playhead jumps that
 * snap to musical subdivisions and automatically return to the nominal
 * (on-track) position after a set number of steps.
 *
 * Architecture:
 *
 *   BufferSourceNode handles ALL transport. Its start(atTime, offset) method
 *   provides sample-accurate scheduling, which is essential for beat-synced
 *   loops with random jumps and reverses. Forward playback uses loop=true so
 *   the Web Audio engine wraps at sample precision — no stop/start glitch.
 *
 *   When useTimeStretch is enabled, a WebAudioPitchShift AudioWorklet EFFECT
 *   is inserted in the audio chain (not as a source — see pitch-shift.js for
 *   why). This gives independent control over speed and pitch:
 *
 *     - stretchRatio (×0.5/×1/×2) multiplies the BufferSourceNode playbackRate,
 *       which changes BOTH speed and pitch of the raw audio.
 *     - The pitch-shift effect then compensates to remove the unwanted pitch
 *       change: totalShift = userPitchShift - 12 * log2(stretchRatio)
 *     - Net result: speed changes independently of pitch, plus separate pitch control.
 *
 *   Signal chain:
 *     BufferSourceNode → [PitchShiftNode] → GainNode(_out) → ...
 *     (PitchShiftNode is only present when useTimeStretch is enabled)
 *
 * Playback rate formula:
 *   effectiveRate = (targetBpm / originalBpm) * speedMultiplier * stretchRatio
 *
 * Loop position tracking:
 *   loopSteps = round(bars * 16 / (speedMultiplier * stretchRatio))
 *   nominalOffset = (globalStep % loopSteps) / loopSteps * bufferDuration
 *
 * Usage:
 *   const brk = new WebAudioBreakPlayer(ctx, { subdivision: 8, returnSteps: 4 });
 *   await brk.load('../data/audio/breaks/0034-break-think.badsister_loop_4_.wav');
 *   brk.connect(ctx.destination);
 *
 *   // In sequencer onStep — call on every step:
 *   brk.trigger(globalStep, bpm, time);
 */
export default class WebAudioBreakPlayer {
  /**
   * @param {AudioContext} ctx
   * @param {object} [options]
   * @param {number} [options.speedMultiplier=1]  Cycles N× faster; pitch shifts accordingly
   * @param {number} [options.subdivision=8]      On-beat jump slots (4, 8, or 16)
   * @param {number} [options.returnSteps=4]      Steps after a jump before returning to nominal
   * @param {number} [options.randomChance=0.1]   0–1 probability of a forward jump per step
   * @param {number} [options.reverseChance=0.04] 0–1 probability of a reverse-playback event per step
   * @param {number} [options.volume=0.8]
   */
  constructor(ctx, options = {}) {
    this.ctx = ctx;
    this.speedMultiplier = options.speedMultiplier ?? 1;
    this.subdivision = options.subdivision ?? 8;
    this.returnSteps = options.returnSteps ?? 4;
    this.randomChance = options.randomChance ?? 0.1;
    this.reverseChance = options.reverseChance ?? 0.04;

    this._buffer = null;
    this._reverseBuffer = null;
    this._bars = 4;
    this._originalBpm = 120;

    this._source = null;
    this._sourcePlaybackRate = -1;
    this._returnAtStep = -1;

    // Pitch-shift effect (inserted in audio chain when useTimeStretch is enabled)
    this._useTimeStretch = options.useTimeStretch ?? false;
    this._pitchShift = 0;
    this._stretchRatio = 1; // ×0.5 / ×1 / ×2 — loop tempo multiplier (independent of Speed)
    this._grainStyle = "clean"; // "clean" (512 samples) or "vintage" (2048 samples)
    this._pitchShiftNode = null;

    this._out = ctx.createGain();
    this._out.gain.value = options.volume ?? 0.8;
  }

  // ---- Loading ----

  async load(url, bars) {
    this.stop();
    this._buffer = null;
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    this._buffer = await this.ctx.decodeAudioData(arrayBuffer);
    this._bars = bars ?? this._parseBars(url);
    this._originalBpm = (this._bars * 4 * 60) / this._buffer.duration;
    this._reverseBuffer = this._buildReverseBuffer(this._buffer);
    this._returnAtStep = -1;

    // Initialize pitch-shift effect node (lazy — only on first load when enabled)
    if (this._useTimeStretch && !this._pitchShiftNode) {
      const { default: WebAudioPitchShift } = await import("./web-audio-pitch-shift.js");
      this._pitchShiftNode = new WebAudioPitchShift(this.ctx);
      await this._pitchShiftNode.ready;
      this._pitchShiftNode.connect(this._out);
    }

    return this;
  }

  _parseBars(url) {
    const m = url.match(/_loop_(\d+)_/i);
    return m ? parseInt(m[1]) : 4;
  }

  _buildReverseBuffer(buffer) {
    const reversed = this.ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const src = buffer.getChannelData(ch);
      const dst = reversed.getChannelData(ch);
      for (let i = 0; i < src.length; i++) dst[i] = src[src.length - 1 - i];
    }
    return reversed;
  }

  get loaded() {
    return this._buffer !== null;
  }

  // ---- Routing ----

  get volume() {
    return this._out.gain.value;
  }

  set volume(v) {
    this._out.gain.value = v;
  }

  get pitchShift() {
    return this._pitchShift;
  }

  set pitchShift(v) {
    this._pitchShift = v;
    this._updatePitchShift();
  }

  get stretchRatio() {
    return this._stretchRatio;
  }

  set stretchRatio(v) {
    this._stretchRatio = v;
    this._updatePitchShift();
    // Force restart on next trigger to apply new playbackRate
    this._sourcePlaybackRate = -1;
  }

  get grainStyle() {
    return this._grainStyle;
  }

  set grainStyle(v) {
    this._grainStyle = v;
    if (this._pitchShiftNode) {
      this._pitchShiftNode.grainSize = v === "vintage" ? 2048 : 512;
    }
  }

  /** Recalculate pitch-shift effect: user pitch + compensation for stretchRatio. */
  _updatePitchShift() {
    if (!this._pitchShiftNode) return;
    const compensation = this._stretchRatio !== 1 ? -12 * Math.log2(this._stretchRatio) : 0;
    this._pitchShiftNode.pitchShift = this._pitchShift + compensation;
  }

  get input() {
    return this._out;
  }

  connect(node) {
    this._out.connect(node.input ?? node);
    return this;
  }

  // ---- Playback ----

  /**
   * Call on every sequencer step. The looping source runs continuously;
   * this only intervenes for initial start, BPM changes, jumps, and returns.
   *
   * @param {number} globalStep  Absolute step count (resets to 0 on play).
   * @param {number} bpm         Current tempo in BPM.
   * @param {number} atTime      AudioContext scheduled time for this step.
   */
  trigger(globalStep, bpm, atTime) {
    if (!this._buffer) return;

    const playbackRate = (bpm / this._originalBpm) * this.speedMultiplier;
    const effectiveRate = playbackRate * this._stretchRatio;
    const effectiveMultiplier = this.speedMultiplier * this._stretchRatio;
    const loopSteps = Math.max(1, Math.round((this._bars * 16) / effectiveMultiplier));
    const nominalOffset = ((globalStep % loopSteps) / loopSteps) * this._buffer.duration;

    // Initial start or reverse event ended naturally — start looping from nominal
    if (!this._source) {
      this._startSource(nominalOffset, atTime, effectiveRate, false);
      this._returnAtStep = -1;
      return;
    }

    // BPM or stretchRatio changed — resync to nominal position with new rate
    if (Math.abs(this._sourcePlaybackRate - effectiveRate) > 0.0001) {
      this._startSource(nominalOffset, atTime, effectiveRate, false);
      this._returnAtStep = -1;
      return;
    }

    // Return from jump or reverse — back to nominal (forward)
    if (this._returnAtStep >= 0 && globalStep >= this._returnAtStep) {
      this._startSource(nominalOffset, atTime, effectiveRate, false);
      this._returnAtStep = -1;
      return;
    }

    // Random events — only when not already mid-jump
    if (this._returnAtStep < 0) {
      // Reverse playback (lower probability, checked first)
      if (Math.random() < this.reverseChance) {
        const slot = Math.floor(Math.random() * this.subdivision);
        const jumpOffset = (slot / this.subdivision) * this._buffer.duration;
        this._startSource(jumpOffset, atTime, effectiveRate, true);
        this._returnAtStep = globalStep + this.returnSteps;
        return;
      }
      // Forward jump
      if (Math.random() < this.randomChance) {
        const slot = Math.floor(Math.random() * this.subdivision);
        const jumpOffset = (slot / this.subdivision) * this._buffer.duration;
        this._startSource(jumpOffset, atTime, effectiveRate, false);
        this._returnAtStep = globalStep + this.returnSteps;
      }
    }
  }

  _startSource(offset, atTime, playbackRate, reverse) {
    // Always use BufferSourceNode for sample-accurate transport
    if (this._source) {
      try {
        this._source.stop(atTime);
      } catch (e) {
        // already ended
      }
      this._source = null;
    }

    const buf = reverse ? this._reverseBuffer : this._buffer;
    const source = this.ctx.createBufferSource();
    source.buffer = buf;
    source.playbackRate.value = playbackRate;

    // Forward sources loop seamlessly at the sample level — no stop/start glitch
    // Reverse sources play once; trigger() handles the return when they end
    if (!reverse) {
      source.loop = true;
      source.loopStart = 0;
      source.loopEnd = buf.duration;
    }

    // Route through pitch-shift effect if available, otherwise direct to output
    source.connect(this._pitchShiftNode?.input ?? this._out);
    source.start(atTime, offset);
    this._source = source;
    this._sourcePlaybackRate = playbackRate;
    source.onended = () => {
      if (this._source === source) this._source = null;
      source.disconnect();
    };
  }

  /**
   * Jump immediately to a fixed segment of the buffer (e.g. kick / hat / snare positions).
   * Cancels any pending return-from-jump so the loop continues from this new position.
   *
   * @param {number} segIndex    0-based segment index (0 = start, 1 = 1/3, 2 = 2/3 for numSegments=3)
   * @param {number} numSegments Number of equal segments to divide the buffer into
   * @param {number} bpm         Current tempo
   * @param {number} atTime      Scheduled AudioContext time
   */
  jumpToSegment(segIndex, numSegments, bpm, atTime) {
    if (!this._buffer) return;
    const playbackRate = (bpm / this._originalBpm) * this.speedMultiplier * this._stretchRatio;
    const offset = (segIndex / numSegments) * this._buffer.duration;
    this._startSource(offset, atTime, playbackRate, false);
    this._returnAtStep = -1;
  }

  stop(atTime) {
    if (this._source) {
      try {
        this._source.stop(atTime ?? this.ctx.currentTime);
      } catch (e) {
        // already ended
      }
      this._source = null;
    }
    this._returnAtStep = -1;
  }

  reset() {
    this._returnAtStep = -1;
    this.stop();
  }
}

// ---- Controls companion component ----

const SPEED_MULTIPLIERS = [
  { label: "×0.5", value: 0.5 },
  { label: "×1", value: 1 },
  { label: "×2", value: 2 },
  { label: "×4", value: 4 },
];

/**
 * WebAudioBreakPlayerControls — portable control panel for WebAudioBreakPlayer.
 *
 * Builds file select, speed/subdivision/return selects, sliders (randomChance,
 * reverseChance, volume), jam buttons (K/H/S), FX unit, and waveform.
 *
 * Audio routing: instrument → analyser → fxUnit → controls._out
 *
 * Usage:
 *   const controls = document.createElement("web-audio-break-player-controls");
 *   parent.appendChild(controls);
 *   controls.bind(breakPlayer, ctx, {
 *     files: [{ label: "Think (4)", file: "0034-break-think.badsister_loop_4_.wav" }],
 *     basePath: "../data/audio/breaks/",
 *     fx: { bpm: 128 },
 *   });
 *   controls.connect(masterGain);
 *   // On each sequencer tick:
 *   controls.step(globalStep, bpm, time);
 */
export class WebAudioBreakPlayerControls extends HTMLElement {
  static SLIDER_DEFS = [
    { param: "volume", label: "Vol", min: 0, max: 1, step: 0.01 },
    { param: "randomChance", label: "Rand Chance", min: 0, max: 1, step: 0.01 },
    { param: "reverseChance", label: "Reverse", min: 0, max: 0.25, step: 0.01 },
  ];

  constructor() {
    super();
    this._instrument = null;
    this._ctx = null;
    this._sliders = {};
    this._fileSelect = null;
    this._speedSelect = null;
    this._subdivSelect = null;
    this._returnSelect = null;
    this._tsControls = null;
    this._fxUnit = null;
    this._out = null;
    this._basePath = "";
    this._pendingSegment = -1;
    this._globalStep = 0;
  }

  /**
   * @param {WebAudioBreakPlayer} instrument
   * @param {AudioContext} ctx
   * @param {object} [options]
   * @param {Array<{label:string, file:string}>} [options.files]  Break file list
   * @param {string} [options.basePath]  URL prefix for break files
   * @param {string} [options.color]
   * @param {string} [options.title]
   * @param {object} [options.fx]  FX unit options
   */
  bind(instrument, ctx, options = {}) {
    this._instrument = instrument;
    this._ctx = ctx;
    this._basePath = options.basePath || "";
    const color = options.color || "#0cc";
    this.innerHTML = "";
    injectControlsCSS();
    this.style.setProperty("--slider-accent", color);
    this.style.setProperty("--fx-accent", color);

    this._muteHandle = createTitleWithMute(this, options.title || "Break Player", () => this._out);

    const controls = document.createElement("div");
    controls.className = "wac-controls";
    this.appendChild(controls);

    // File select
    if (options.files?.length) {
      const fileWrap = document.createElement("div");
      fileWrap.className = "wac-ctrl wac-ctrl-wide";
      fileWrap.appendChild(Object.assign(document.createElement("label"), { textContent: "Loop" }));
      this._fileSelect = document.createElement("select");
      this._fileSelect.className = "wac-select";
      const noneOpt = document.createElement("option");
      noneOpt.value = "";
      noneOpt.textContent = "— None —";
      this._fileSelect.appendChild(noneOpt);
      for (const { label, file } of options.files) {
        const opt = document.createElement("option");
        opt.value = file;
        opt.textContent = label;
        this._fileSelect.appendChild(opt);
      }
      this._fileSelect.addEventListener("change", () => {
        this._loadFile();
        this._emitChange();
      });
      fileWrap.appendChild(this._fileSelect);
      controls.appendChild(fileWrap);
    }

    // Speed select
    const speedWrap = document.createElement("div");
    speedWrap.className = "wac-ctrl";
    speedWrap.appendChild(Object.assign(document.createElement("label"), { textContent: "Speed" }));
    const speedSelect = document.createElement("select");
    speedSelect.className = "wac-select";
    this._speedSelect = speedSelect;
    for (const { label, value } of SPEED_MULTIPLIERS) {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      if (value === instrument.speedMultiplier) opt.selected = true;
      speedSelect.appendChild(opt);
    }
    speedSelect.addEventListener("change", () => {
      instrument.speedMultiplier = parseFloat(speedSelect.value);
      this._emitChange();
    });
    speedWrap.appendChild(speedSelect);
    controls.appendChild(speedWrap);

    // Subdivision select
    const subdivWrap = document.createElement("div");
    subdivWrap.className = "wac-ctrl";
    subdivWrap.appendChild(Object.assign(document.createElement("label"), { textContent: "Jump Grid" }));
    const subdivSelect = document.createElement("select");
    subdivSelect.className = "wac-select";
    this._subdivSelect = subdivSelect;
    for (const v of [4, 8, 16]) {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = `÷${v}`;
      if (v === instrument.subdivision) opt.selected = true;
      subdivSelect.appendChild(opt);
    }
    subdivSelect.addEventListener("change", () => {
      instrument.subdivision = parseInt(subdivSelect.value);
      this._emitChange();
    });
    subdivWrap.appendChild(subdivSelect);
    controls.appendChild(subdivWrap);

    // Return steps select
    const returnWrap = document.createElement("div");
    returnWrap.className = "wac-ctrl";
    returnWrap.appendChild(Object.assign(document.createElement("label"), { textContent: "Return" }));
    const returnSelect = document.createElement("select");
    returnSelect.className = "wac-select";
    this._returnSelect = returnSelect;
    for (const [v, lbl] of [
      [1, "1 step"],
      [2, "2 steps"],
      [4, "4 steps"],
      [8, "8 steps"],
      [16, "16 steps"],
    ]) {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = lbl;
      if (v === instrument.returnSteps) opt.selected = true;
      returnSelect.appendChild(opt);
    }
    returnSelect.addEventListener("change", () => {
      instrument.returnSteps = parseInt(returnSelect.value);
      this._emitChange();
    });
    returnWrap.appendChild(returnSelect);
    controls.appendChild(returnWrap);

    // Sliders
    for (const def of WebAudioBreakPlayerControls.SLIDER_DEFS) {
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
      this._emitChange();
    });

    // Time-stretch controls (only when enabled)
    this._tsControls = null;
    if (instrument._useTimeStretch) {
      this._tsControls = document.createElement("web-audio-time-stretch-controls");
      this.appendChild(this._tsControls);
      this._tsControls.init(instrument, { color });
    }

    // Jam buttons
    const actionRow = document.createElement("div");
    actionRow.className = "wac-action-row";

    for (const [label, seg, key] of [
      ["K", 0, "Z"],
      ["H", 1, "X"],
      ["S", 2, "C"],
    ]) {
      const btn = document.createElement("button");
      btn.textContent = `${label} [${key}]`;
      btn.className = "wac-action-btn";
      btn.addEventListener("mousedown", () => {
        this._pendingSegment = seg;
      });
      actionRow.appendChild(btn);
    }
    this.appendChild(actionRow);

    // FX unit
    this._fxUnit = document.createElement("web-audio-fx-unit");
    this.appendChild(this._fxUnit);
    this._fxUnit.init(ctx, { title: "Break FX", bpm: options.fx?.bpm ?? 120, ...options.fx });

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

  // ---- File loading ----

  _loadFile() {
    if (!this._instrument || !this._fileSelect) return;
    const file = this._fileSelect.value;
    if (file) this._instrument.load(this._basePath + file);
    else this._instrument.stop();
  }

  /** Programmatically select a break file by filename. */
  selectFile(filename) {
    if (this._fileSelect) {
      this._fileSelect.value = filename;
      this._loadFile();
    }
  }

  // ---- Sequencer integration ----

  /**
   * Called by the host on each sequencer tick.
   * @param {number} globalStep  Absolute step count
   * @param {number} bpm         Current tempo
   * @param {number} time        AudioContext scheduled time
   */
  step(globalStep, bpm, time) {
    if (!this._instrument?.loaded) return;
    this._globalStep = globalStep;
    if (this._pendingSegment >= 0) {
      this._instrument.jumpToSegment(this._pendingSegment, 3, bpm, time);
      this._pendingSegment = -1;
    } else {
      this._instrument.trigger(globalStep, bpm, time);
    }
  }

  /** Queue a segment jump for the next step (for keyboard shortcuts). */
  jumpToSegment(seg) {
    this._pendingSegment = seg;
  }

  setActiveStep() {
    /* no-op — break player has no step grid */
  }
  setScale() {
    /* no-op — break player doesn't use notes */
  }

  // ---- Serialization ----

  _emitChange() {
    this.dispatchEvent(new CustomEvent("controls-change", { bubbles: true }));
  }

  toJSON() {
    if (!this._instrument) return null;
    const params = {};
    for (const def of WebAudioBreakPlayerControls.SLIDER_DEFS) params[def.param] = this._instrument[def.param];
    return {
      params,
      file: this._fileSelect?.value || "",
      speedMultiplier: this._instrument.speedMultiplier,
      subdivision: this._instrument.subdivision,
      returnSteps: this._instrument.returnSteps,
      ts: this._tsControls?.toJSON(),
      fx: this._fxUnit?.toJSON(),
      muted: this._muteHandle?.isMuted() ?? false,
    };
  }

  fromJSON(obj) {
    if (!obj || !this._instrument) return;
    if (obj.params) {
      for (const [key, val] of Object.entries(obj.params)) {
        this._instrument[key] = val;
        if (this._sliders[key]) this._sliders[key].value = val;
      }
    }
    if (obj.speedMultiplier != null) {
      this._instrument.speedMultiplier = obj.speedMultiplier;
      if (this._speedSelect) this._speedSelect.value = obj.speedMultiplier;
    }
    if (obj.subdivision != null) {
      this._instrument.subdivision = obj.subdivision;
      if (this._subdivSelect) this._subdivSelect.value = obj.subdivision;
    }
    if (obj.returnSteps != null) {
      this._instrument.returnSteps = obj.returnSteps;
      if (this._returnSelect) this._returnSelect.value = obj.returnSteps;
    }
    if (obj.file && this._fileSelect) {
      this._fileSelect.value = obj.file;
      this._loadFile();
    }
    // Backwards-compat: old format stored pitchShift in params and stretchRatio at top level
    if (!obj.ts && (obj.params?.pitchShift != null || obj.stretchRatio != null)) {
      const compat = { pitchShift: obj.params?.pitchShift ?? 0, stretchRatio: obj.stretchRatio ?? 1 };
      this._tsControls?.fromJSON(compat);
    }
    if (obj.ts) this._tsControls?.fromJSON(obj.ts);
    if (obj.fx) this._fxUnit?.fromJSON(obj.fx);
    if (obj.muted != null) this._muteHandle?.setMuted(obj.muted);
  }

  // ---- Routing ----

  set bpm(v) {
    if (this._fxUnit) this._fxUnit.bpm = v;
  }

  connect(node) {
    if (this._out) this._out.connect(node.input ?? node);
    return this;
  }
}

customElements.define("web-audio-break-player-controls", WebAudioBreakPlayerControls);
