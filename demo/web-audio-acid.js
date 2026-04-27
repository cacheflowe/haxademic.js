import DemoBase from "./demo--base-element.js";
import WebAudioSequencer from "../src/web-audio/web-audio-sequencer.js";
import WebAudioSynthAcid from "../src/web-audio/web-audio-synth-acid.js";
import WebAudioSynth808 from "../src/web-audio/web-audio-synth-808.js";
import WebAudioSynthBlipFX from "../src/web-audio/web-audio-synth-blipfx.js";
import WebAudioBreakPlayer from "../src/web-audio/web-audio-break-player.js";
import WebAudioSynthFM from "../src/web-audio/web-audio-synth-fm.js";
import "../src/web-audio/web-audio-slider.js";
import { SCALES, NOTE_NAMES } from "../src/web-audio/web-audio-scales.js";

const BREAK_FILES = [
  { label: "FunkyDrum (8 bars)", file: "0032-break-FUNKYDRUM_loop_8_.wav" },
  { label: "Shackup (16 bars)", file: "0033-break-shackup_loop_16_.wav" },
  { label: "Think (4 bars)", file: "0034-break-think.badsister_loop_4_.wav" },
  { label: "Hotpants (4 bars)", file: "0037_SamplepackHotpants_loop_4_.wav" },
];

class WebAudioAcid extends DemoBase {
  static meta = {
    title: "Web Audio Acid / TB-303",
    category: "Media",
    description: "TB-303 acid bass + 808 + BlipFX SFX with 16-step sequencer and break player",
  };

  static STORAGE_KEY = "web-audio-acid-state";

  init() {
    this._ctx = null;
    this._masterGain = null;
    this._acid = null;
    this._808 = null;
    this._break = null;
    this._blipfx = null;
    this._fmSynth = null;
    this._seq = null;
    this._globalStep = 0;
    this._playing = false;
    this._saveTimer = null;

    // Controls components
    this._acidControls = null;
    this._808Controls = null;
    this._fmControls = null;
    this._blipfxControls = null;
    this._breakControls = null;

    this._p = { bpm: 128 };

    this.buildUI();
    this.addCSS();
    this._initAudio(); // eager init — AudioContext starts suspended, controls are visible immediately
    this._setupKeyboardJam();
  }

  // ---- Audio ----

  _initAudio() {
    if (this._ctx) return;
    this._ctx = new AudioContext();

    this._masterGain = this._ctx.createGain();
    this._masterGain.gain.value = 1.0;
    this._masterGain.connect(this._ctx.destination);

    // TB-303 acid
    this._acid = new WebAudioSynthAcid(this._ctx);
    this._acidControls.bind(this._acid, this._ctx, {
      fx: { bpm: this._p.bpm, reverbWet: 0.15, delayInterval: 0.75, delayFeedback: 0.35, delayMix: 0 },
    });
    this._acidControls.connect(this._masterGain);

    // 808 bass
    this._808 = new WebAudioSynth808(this._ctx);
    this._808Controls.bind(this._808, this._ctx, { fx: { bpm: this._p.bpm } });
    this._808Controls.connect(this._masterGain);

    // Break player
    this._break = new WebAudioBreakPlayer(this._ctx, {
      speedMultiplier: 4,
      subdivision: 4,
      returnSteps: 1,
      randomChance: 0.1,
      reverseChance: 0.04,
      volume: 0.8,
      useTimeStretch: true,
    });
    this._breakControls.bind(this._break, this._ctx, {
      files: BREAK_FILES,
      basePath: "../data/audio/breaks/",
      fx: { bpm: this._p.bpm },
    });
    this._breakControls.connect(this._masterGain);

    // BlipFX
    this._blipfx = new WebAudioSynthBlipFX(this._ctx, { volume: 0.5 });
    this._blipfxControls.bind(this._blipfx, this._ctx, { fx: { bpm: this._p.bpm } });
    this._blipfxControls.connect(this._masterGain);

    // FM Chord Synth
    this._fmSynth = new WebAudioSynthFM(this._ctx);
    this._fmControls.bind(this._fmSynth, this._ctx, {
      fx: { bpm: this._p.bpm, reverbWet: 0.2, delayInterval: 0.5, delayFeedback: 0.4, delayMix: 0.1 },
    });
    this._fmControls.connect(this._masterGain);

    // Set initial scale on all controls
    this._updateScale();

    // Load saved state (URL hash takes priority over localStorage)
    const pendingState = this._loadFromURL() || this._loadFromLocalStorage();
    if (pendingState) this._loadState(pendingState);

    // Auto-save on any controls change (debounced)
    this.addEventListener("controls-change", () => this._debouncedSave());

    // Sequencer
    this._seq = new WebAudioSequencer(this._ctx, {
      bpm: this._p.bpm,
      steps: 16,
      subdivision: 16,
    });
    this._seq.onStep((step, time) => {
      const dur = this._seq.stepDurationSec();

      // Each controls component owns its own step pattern / trigger logic
      this._acidControls.step(step, time, dur);
      this._808Controls.step(step, time, dur);
      this._fmControls.step(step, time, dur);
      this._blipfxControls.step(step, time);
      this._breakControls.step(this._globalStep, this._p.bpm, time);

      // UI step highlight
      const uiDelay = Math.max(0, (time - this._ctx.currentTime) * 1000);
      setTimeout(() => {
        this._acidControls.setActiveStep(step);
        this._808Controls.setActiveStep(step);
        this._fmControls.setActiveStep(step);
        this._blipfxControls.setActiveStep(step);
      }, uiDelay);
      this._globalStep++;
    });
  }

  _play() {
    if (this._ctx.state === "suspended") this._ctx.resume();
    this._playing = true;
    this._globalStep = 0;
    this._acid.reset();
    this._seq.bpm = this._p.bpm;
    this._seq.start();
    this._playBtn.textContent = "◼ Stop";
  }

  _stop() {
    this._playing = false;
    this._seq?.stop();
    this._break?.stop();
    this._acidControls?.setActiveStep(-1);
    this._808Controls?.setActiveStep(-1);
    this._fmControls?.setActiveStep(-1);
    this._blipfxControls?.setActiveStep(-1);
    this._breakControls?.setActiveStep(-1);
    this._playBtn.textContent = "▶ Play";
  }

  _updateScale() {
    const root = parseInt(this._rootSelect.value);
    const scale = this._scaleSelect.value;
    this._acidControls?.setScale(root, scale);
    this._808Controls?.setScale(root, scale);
    this._fmControls?.setScale(root, scale);
    this._blipfxControls?.setScale(root, scale);
  }

  _setupKeyboardJam() {
    document.addEventListener("keydown", (e) => {
      if (["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
      const key = e.key.toLowerCase();
      switch (key) {
        case " ":
          e.preventDefault();
          this._playing ? this._stop() : this._play();
          break;
        case "z":
          this._breakControls?.jumpToSegment(0);
          break;
        case "x":
          this._breakControls?.jumpToSegment(1);
          break;
        case "c":
          this._breakControls?.jumpToSegment(2);
          break;
        case "v":
          if (this._ctx.state === "suspended") this._ctx.resume();
          this._blipfxControls?.triggerNow();
          break;
        case "b":
          this._acidControls?.queueRandomNote();
          break;
        case "n":
          if (this._ctx.state === "suspended") this._ctx.resume();
          this._fmControls?.triggerJamChord();
          break;
      }
    });
  }

  // ---- Persistence ----

  _getState() {
    return {
      v: 1,
      bpm: this._p.bpm,
      root: parseInt(this._rootSelect.value),
      scale: this._scaleSelect.value,
      acid: this._acidControls?.toJSON(),
      bass808: this._808Controls?.toJSON(),
      fm: this._fmControls?.toJSON(),
      blipfx: this._blipfxControls?.toJSON(),
      break: this._breakControls?.toJSON(),
    };
  }

  _loadState(state) {
    if (!state || state.v !== 1) return;
    if (state.bpm != null) {
      this._p.bpm = state.bpm;
      if (this._seq) this._seq.bpm = state.bpm;
      if (this._bpmSlider) this._bpmSlider.value = state.bpm;
      [this._acidControls, this._808Controls, this._fmControls, this._blipfxControls, this._breakControls].forEach(
        (c) => {
          if (c) c.bpm = state.bpm;
        },
      );
    }
    if (state.root != null && this._rootSelect) this._rootSelect.value = state.root;
    if (state.scale != null && this._scaleSelect) this._scaleSelect.value = state.scale;
    if (state.root != null || state.scale != null) this._updateScale();
    if (state.acid) this._acidControls?.fromJSON(state.acid);
    if (state.bass808) this._808Controls?.fromJSON(state.bass808);
    if (state.fm) this._fmControls?.fromJSON(state.fm);
    if (state.blipfx || state.zzfx) this._blipfxControls?.fromJSON(state.blipfx ?? state.zzfx);
    if (state.break) this._breakControls?.fromJSON(state.break);
  }

  _debouncedSave() {
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this._saveToLocalStorage(), 500);
  }

  _saveToLocalStorage() {
    try {
      localStorage.setItem(WebAudioAcid.STORAGE_KEY, JSON.stringify(this._getState()));
    } catch (e) {
      /* quota exceeded or private mode — ignore */
    }
  }

  _loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem(WebAudioAcid.STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  _loadFromURL() {
    try {
      const hash = location.hash;
      if (!hash.startsWith("#s=")) return null;
      const json = atob(hash.slice(3).replace(/-/g, "+").replace(/_/g, "/"));
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  }

  _shareURL() {
    const json = JSON.stringify(this._getState());
    const b64 = btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const url = `${location.origin}${location.pathname}#s=${b64}`;
    navigator.clipboard?.writeText(url).then(
      () => {
        this._shareBtn.textContent = "Copied!";
        setTimeout(() => {
          this._shareBtn.textContent = "Share URL";
        }, 1500);
      },
      () => {
        prompt("Copy this URL:", url);
      },
    );
  }

  // ---- UI ----

  buildUI() {
    // ---- Transport ----
    const transport = this.injectHTML(`<div class="acid-transport"></div>`);
    this._playBtn = document.createElement("button");
    this._playBtn.textContent = "▶ Play";
    this._playBtn.className = "acid-play";
    this._playBtn.addEventListener("click", () => (this._playing ? this._stop() : this._play()));
    transport.appendChild(this._playBtn);

    const bpmSlider = document.createElement("web-audio-slider");
    bpmSlider.setAttribute("param", "bpm");
    bpmSlider.setAttribute("label", "BPM");
    bpmSlider.setAttribute("min", 60);
    bpmSlider.setAttribute("max", 200);
    bpmSlider.setAttribute("step", 1);
    bpmSlider.value = this._p.bpm;
    this._bpmSlider = bpmSlider;
    bpmSlider.addEventListener("slider-input", (e) => {
      const v = e.detail.value;
      this._p.bpm = v;
      if (this._seq) this._seq.bpm = v;
      if (this._acidControls) this._acidControls.bpm = v;
      if (this._808Controls) this._808Controls.bpm = v;
      if (this._fmControls) this._fmControls.bpm = v;
      if (this._blipfxControls) this._blipfxControls.bpm = v;
      if (this._breakControls) this._breakControls.bpm = v;
      this._debouncedSave();
    });
    transport.appendChild(bpmSlider);

    // Global scale selects
    this._rootSelect = document.createElement("select");
    this._rootSelect.className = "acid-select";
    for (let midi = 24; midi <= 35; midi++) {
      const opt = document.createElement("option");
      opt.value = midi;
      opt.textContent = NOTE_NAMES[midi % 12];
      if (midi === 29) opt.selected = true;
      this._rootSelect.appendChild(opt);
    }
    this._scaleSelect = document.createElement("select");
    this._scaleSelect.className = "acid-select";
    Object.keys(SCALES).forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      this._scaleSelect.appendChild(opt);
    });
    this._rootSelect.addEventListener("change", () => {
      this._updateScale();
      this._debouncedSave();
    });
    this._scaleSelect.addEventListener("change", () => {
      this._updateScale();
      this._debouncedSave();
    });
    const scaleLabel = Object.assign(document.createElement("div"), {
      className: "transport-scale-label",
      textContent: "Key / Scale",
    });
    const scaleWrap = document.createElement("div");
    scaleWrap.className = "transport-scale-wrap";
    scaleWrap.appendChild(scaleLabel);
    const scaleSelects = document.createElement("div");
    scaleSelects.className = "transport-scale-selects";
    scaleSelects.appendChild(this._rootSelect);
    scaleSelects.appendChild(this._scaleSelect);
    scaleWrap.appendChild(scaleSelects);
    transport.appendChild(scaleWrap);

    // Share button
    this._shareBtn = document.createElement("button");
    this._shareBtn.textContent = "Share URL";
    this._shareBtn.className = "acid-share";
    this._shareBtn.addEventListener("click", () => this._shareURL());
    transport.appendChild(this._shareBtn);

    // ---- Break group ----
    const breakGroup = this.injectHTML(`<div class="instrument-group break-group"></div>`);
    this._breakControls = document.createElement("web-audio-break-player-controls");
    breakGroup.appendChild(this._breakControls);

    // ---- 808 group ----
    const g808 = this.injectHTML(`<div class="instrument-group bass808-group"></div>`);
    this._808Controls = document.createElement("web-audio-synth-808-controls");
    g808.appendChild(this._808Controls);

    // ---- FM Chord group ----
    const fmGroup = this.injectHTML(`<div class="instrument-group chord-fm-group"></div>`);
    this._fmControls = document.createElement("web-audio-synth-fm-controls");
    fmGroup.appendChild(this._fmControls);

    // ---- BlipFX group ----
    const blipfxGroup = this.injectHTML(`<div class="instrument-group blipfx-group"></div>`);
    this._blipfxControls = document.createElement("web-audio-synth-blipfx-controls");
    blipfxGroup.appendChild(this._blipfxControls);

    // ---- Acid / TB-303 group ----
    const acidGroup = this.injectHTML(`<div class="instrument-group acid-group"></div>`);
    this._acidControls = document.createElement("web-audio-synth-acid-controls");
    acidGroup.appendChild(this._acidControls);
  }

  addCSS() {
    this.injectCSS(`
      /* Prevent double-tap zoom on touch devices */
      * {
        touch-action: manipulation;
      }

      web-audio-acid {
        display: block;
        font-family: monospace;
        background: #111;
        color: #ccc;
        padding: 16px;
        border-radius: 6px;
      }

      /* ---- Instrument groups ---- */
      .instrument-group {
        border: 1px solid #222;
        border-radius: 6px;
        overflow: hidden;
        margin-bottom: 12px;
      }

      /* Per-instrument accent colors */
      .break-group   { --fx-accent: #0cc; }
      .bass808-group { --fx-accent: #fa0; }
      .chord-fm-group { --fx-accent: #4af; }
      .blipfx-group    { --fx-accent: #c0f; }
      .acid-group    { --fx-accent: #0f0; }

      /* ---- Transport ---- */
      .acid-transport {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 12px;
        --slider-accent: #0f0;
      }
      .acid-play {
        padding: 8px 20px;
        font-family: monospace;
        font-size: 1em;
        background: #0a1a0a;
        color: #0f0;
        border: 2px solid #0f0;
        border-radius: 4px;
        cursor: pointer;
        white-space: nowrap;
      }
      .acid-play:hover { background: #0f0; color: #000; }
      .acid-share {
        padding: 8px 14px;
        font-family: monospace;
        font-size: 0.85em;
        background: #0a0a1a;
        color: #4af;
        border: 1px solid #4af;
        border-radius: 4px;
        cursor: pointer;
        white-space: nowrap;
      }
      .acid-share:hover { background: #4af; color: #000; }

      /* ---- Transport scale wrap ---- */
      .transport-scale-wrap {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .transport-scale-label {
        font-size: 0.65em;
        color: #555;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .transport-scale-selects {
        display: flex;
        gap: 6px;
      }

      /* ---- Shared selects (transport) ---- */
      .acid-select {
        font-family: monospace;
        font-size: 0.85em;
        background: #222;
        color: #ccc;
        border: 1px solid #444;
        border-radius: 3px;
        padding: 5px 6px;
        cursor: pointer;
        margin: 0;
      }

      /* ---- Waveform displays ---- */
      web-audio-waveform {
        height: 44px;
        background: #060606;
        border-top: 1px solid #151515;
      }
      .break-group  web-audio-waveform { border-color: #002020; }
      .bass808-group web-audio-waveform { border-color: #1a0f00; }
      .chord-fm-group web-audio-waveform { border-color: #001a2a; }
      .blipfx-group   web-audio-waveform { border-color: #100020; }
      .acid-group   web-audio-waveform { border-color: #001500; }
    `);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._stop();
    this._ctx?.close();
  }
}

customElements.define("web-audio-acid", WebAudioAcid);
