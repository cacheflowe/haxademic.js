import "./web-audio-slider.js";
import { injectControlsCSS, createTitleWithMute } from "./web-audio-slider.js";

/**
 * WebAudioSynthBlipFX — procedural sound effect synthesizer.
 *
 * Bakes sound effects into AudioBuffers from a rich set of synthesis parameters:
 * oscillator shape (6 types), frequency, pitch slide/jump/acceleration, ADSR
 * amplitude envelope, noise, tremolo, bit-crush, FM modulation, shape curve
 * distortion, and cyclic repeat. Call randomize() to generate a new random
 * squelch, or use applyPreset() for curated sounds. trigger() is fire-and-forget.
 *
 * Usage:
 *   const sfx = new WebAudioSynthBlipFX(ctx);
 *   sfx.connect(ctx.destination);
 *   sfx.applyPreset("Laser");
 *   sfx.trigger(atTime);
 */
export default class WebAudioSynthBlipFX {
  static PRESETS = {
    Laser: {
      frequency: 700,
      attack: 0,
      decay: 0,
      sustain: 0,
      sustainVolume: 1,
      release: 0.2,
      shape: 0,
      shapeCurve: 1,
      noise: 0,
      slide: -40,
      deltaSlide: 0,
      pitchJump: 0,
      pitchJumpTime: 0,
      repeatTime: 0,
      modulation: 0,
      tremolo: 0,
      bitCrush: 0,
      volume: 0.6,
    },
    Zap: {
      frequency: 400,
      attack: 0,
      decay: 0,
      sustain: 0.02,
      sustainVolume: 1,
      release: 0.12,
      shape: 2,
      shapeCurve: 1,
      noise: 0.1,
      slide: 25,
      deltaSlide: 0,
      pitchJump: -20,
      pitchJumpTime: 0.05,
      repeatTime: 0,
      modulation: 0,
      tremolo: 0,
      bitCrush: 0,
      volume: 0.55,
    },
    Coin: {
      frequency: 600,
      attack: 0,
      decay: 0,
      sustain: 0.02,
      sustainVolume: 1,
      release: 0.15,
      shape: 0,
      shapeCurve: 1,
      noise: 0,
      slide: 0,
      deltaSlide: 0,
      pitchJump: 12,
      pitchJumpTime: 0.04,
      repeatTime: 0,
      modulation: 0,
      tremolo: 0,
      bitCrush: 0,
      volume: 0.5,
    },
    Explosion: {
      frequency: 80,
      attack: 0.01,
      decay: 0.05,
      sustain: 0.1,
      sustainVolume: 0.6,
      release: 0.35,
      shape: 3,
      shapeCurve: 1.5,
      noise: 0.4,
      slide: -5,
      deltaSlide: 0,
      pitchJump: 0,
      pitchJumpTime: 0,
      repeatTime: 0,
      modulation: 0,
      tremolo: 0.2,
      bitCrush: 0.2,
      volume: 0.7,
    },
    Blip: {
      frequency: 500,
      attack: 0,
      decay: 0,
      sustain: 0,
      sustainVolume: 1,
      release: 0.05,
      shape: 0,
      shapeCurve: 1,
      noise: 0,
      slide: 5,
      deltaSlide: 0,
      pitchJump: 0,
      pitchJumpTime: 0,
      repeatTime: 0,
      modulation: 0,
      tremolo: 0,
      bitCrush: 0,
      volume: 0.5,
    },
    Alarm: {
      frequency: 400,
      attack: 0.005,
      decay: 0,
      sustain: 0.1,
      sustainVolume: 1,
      release: 0.1,
      shape: 0,
      shapeCurve: 1,
      noise: 0,
      slide: 0,
      deltaSlide: 0,
      pitchJump: 12,
      pitchJumpTime: 0.05,
      repeatTime: 0.15,
      modulation: 0,
      tremolo: 0,
      bitCrush: 0,
      volume: 0.5,
    },
    Glitch: {
      frequency: 200,
      attack: 0,
      decay: 0.02,
      sustain: 0.03,
      sustainVolume: 0.5,
      release: 0.1,
      shape: 3,
      shapeCurve: 2,
      noise: 0.2,
      slide: 10,
      deltaSlide: -8,
      pitchJump: 0,
      pitchJumpTime: 0,
      repeatTime: 0,
      modulation: 0.3,
      tremolo: 0,
      bitCrush: 0.5,
      volume: 0.5,
    },
    Metallic: {
      frequency: 300,
      attack: 0.005,
      decay: 0.03,
      sustain: 0.05,
      sustainVolume: 0.4,
      release: 0.2,
      shape: 0,
      shapeCurve: 1,
      noise: 0,
      slide: 0,
      deltaSlide: 0,
      pitchJump: 0,
      pitchJumpTime: 0,
      repeatTime: 0,
      modulation: 0.5,
      tremolo: 0,
      bitCrush: 0,
      volume: 0.55,
    },
  };

  static SHAPES = ["Sine", "Triangle", "Saw", "Square", "Noise", "Tan"];

  /**
   * @param {AudioContext} ctx
   * @param {object} [options]
   * @param {number}  [options.volume=0.6]
   * @param {boolean} [options.randomizeOnTrigger=false]
   */
  constructor(ctx, options = {}) {
    this.ctx = ctx;
    this.randomizeOnTrigger = options.randomizeOnTrigger ?? false;
    this._buffer = null;
    this._dirty = false;
    this._rebakeTimer = null;

    // Synthesis params — all exposed as properties
    this._frequency = 220;
    this._attack = 0.01;
    this._decay = 0;
    this._sustain = 0.05;
    this._sustainVolume = 1;
    this._release = 0.15;
    this._shape = 0;
    this._shapeCurve = 1;
    this._noise = 0;
    this._slide = 0;
    this._deltaSlide = 0;
    this._pitchJump = 0;
    this._pitchJumpTime = 0.05;
    this._repeatTime = 0;
    this._modulation = 0;
    this._tremolo = 0;
    this._bitCrush = 0;

    // Volume gain (final output)
    this._out = ctx.createGain();
    this._out.gain.value = options.volume ?? 0.6;

    // HPF → LPF filter chain before output
    this._hpf = ctx.createBiquadFilter();
    this._hpf.type = "highpass";
    this._hpf.frequency.value = options.hpfFreq ?? 80;
    this._hpf.Q.value = 1;

    this._lpf = ctx.createBiquadFilter();
    this._lpf.type = "lowpass";
    this._lpf.frequency.value = options.lpfFreq ?? 1200;
    this._lpf.Q.value = options.lpfResonance ?? 1;

    this._hpf.connect(this._lpf);
    this._lpf.connect(this._out);

    this.randomize();
  }

  // ---- Synthesis param properties (set marks dirty) ----

  get frequency() {
    return this._frequency;
  }
  set frequency(v) {
    this._frequency = v;
    this._markDirty();
  }

  get attack() {
    return this._attack;
  }
  set attack(v) {
    this._attack = v;
    this._markDirty();
  }

  get decay() {
    return this._decay;
  }
  set decay(v) {
    this._decay = v;
    this._markDirty();
  }

  get sustain() {
    return this._sustain;
  }
  set sustain(v) {
    this._sustain = v;
    this._markDirty();
  }

  get sustainVolume() {
    return this._sustainVolume;
  }
  set sustainVolume(v) {
    this._sustainVolume = v;
    this._markDirty();
  }

  get release() {
    return this._release;
  }
  set release(v) {
    this._release = v;
    this._markDirty();
  }

  get shape() {
    return this._shape;
  }
  set shape(v) {
    this._shape = v;
    this._markDirty();
  }

  get shapeCurve() {
    return this._shapeCurve;
  }
  set shapeCurve(v) {
    this._shapeCurve = v;
    this._markDirty();
  }

  get noise() {
    return this._noise;
  }
  set noise(v) {
    this._noise = v;
    this._markDirty();
  }

  get slide() {
    return this._slide;
  }
  set slide(v) {
    this._slide = v;
    this._markDirty();
  }

  get deltaSlide() {
    return this._deltaSlide;
  }
  set deltaSlide(v) {
    this._deltaSlide = v;
    this._markDirty();
  }

  get pitchJump() {
    return this._pitchJump;
  }
  set pitchJump(v) {
    this._pitchJump = v;
    this._markDirty();
  }

  get pitchJumpTime() {
    return this._pitchJumpTime;
  }
  set pitchJumpTime(v) {
    this._pitchJumpTime = v;
    this._markDirty();
  }

  get repeatTime() {
    return this._repeatTime;
  }
  set repeatTime(v) {
    this._repeatTime = v;
    this._markDirty();
  }

  get modulation() {
    return this._modulation;
  }
  set modulation(v) {
    this._modulation = v;
    this._markDirty();
  }

  get tremolo() {
    return this._tremolo;
  }
  set tremolo(v) {
    this._tremolo = v;
    this._markDirty();
  }

  get bitCrush() {
    return this._bitCrush;
  }
  set bitCrush(v) {
    this._bitCrush = v;
    this._markDirty();
  }

  // ---- Filter / output properties (no rebake needed) ----

  get volume() {
    return this._out.gain.value;
  }
  set volume(v) {
    this._out.gain.value = v;
  }

  get lpfFreq() {
    return this._lpf.frequency.value;
  }
  set lpfFreq(v) {
    this._lpf.frequency.value = v;
  }

  get lpfResonance() {
    return this._lpf.Q.value;
  }
  set lpfResonance(v) {
    this._lpf.Q.value = v;
  }

  get hpfFreq() {
    return this._hpf.frequency.value;
  }
  set hpfFreq(v) {
    this._hpf.frequency.value = v;
  }

  // ---- Routing ----

  get input() {
    return this._hpf;
  }

  connect(node) {
    this._out.connect(node.input ?? node);
    return this;
  }

  // ---- Presets ----

  applyPreset(name) {
    const p = WebAudioSynthBlipFX.PRESETS[name];
    if (!p) return;
    // Batch-set all params without intermediate rebakes
    for (const [key, val] of Object.entries(p)) {
      if (key === "volume") {
        this.volume = val;
        continue;
      }
      const prop = `_${key}`;
      if (prop in this) this[prop] = val;
    }
    this._rebake();
  }

  // ---- Debounced rebake ----

  _markDirty() {
    this._dirty = true;
    clearTimeout(this._rebakeTimer);
    this._rebakeTimer = setTimeout(() => this._flushRebake(), 50);
  }

  _flushRebake() {
    if (!this._dirty) return;
    this._dirty = false;
    this._rebake();
  }

  _rebake() {
    this._dirty = false;
    this._buffer = this._generateBuffer();
  }

  // ---- Sound generation ----

  /** Bake a new random sound effect into the internal buffer. */
  randomize() {
    const r = () => Math.random();
    this._frequency = 40 + r() * 760;
    this._attack = r() * 0.02;
    this._decay = r() * 0.1;
    this._sustain = r() * 0.08;
    this._sustainVolume = 0.3 + r() * 0.7;
    this._release = 0.04 + r() * 0.35;
    this._shape = Math.floor(r() * 6);
    this._shapeCurve = 0.5 + r() * 2;
    this._noise = Math.pow(r(), 2) * 0.5;
    this._slide = (r() * 2 - 1) * 28;
    this._deltaSlide = Math.pow(r(), 2) * (r() > 0.5 ? 10 : -10);
    this._pitchJump = (r() * 2 - 1) * 24;
    this._pitchJumpTime = r() * 0.18;
    this._repeatTime = r() < 0.3 ? r() * 0.3 : 0;
    this._modulation = r() < 0.3 ? r() * 0.5 : 0;
    this._tremolo = Math.pow(r(), 2) * 0.6;
    this._bitCrush = Math.pow(r(), 3) * 0.7;
    this._rebake();
  }

  /** Schedule one sound effect hit. */
  trigger(atTime) {
    if (this.randomizeOnTrigger) this.randomize();
    else this._flushRebake(); // ensure buffer is up-to-date
    if (!this._buffer) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this._buffer;
    source.connect(this._hpf);
    source.start(atTime);
    source.onended = () => source.disconnect();
  }

  // ---- Synthesis ----

  _generateBuffer() {
    const {
      _frequency: frequency,
      _attack: attack,
      _decay: decay,
      _sustain: sustain,
      _sustainVolume: sustainVolume,
      _release: release,
      _shape: shape,
      _shapeCurve: shapeCurve,
      _noise: noise,
      _slide: slide,
      _deltaSlide: deltaSlide,
      _pitchJump: pitchJump,
      _pitchJumpTime: pitchJumpTime,
      _repeatTime: repeatTime,
      _modulation: modulation,
      _tremolo: tremolo,
      _bitCrush: bitCrush,
    } = this;

    const sr = this.ctx.sampleRate;
    const duration = attack + decay + sustain + release;
    if (duration <= 0) return null;
    const length = Math.ceil(sr * duration);
    const buf = this.ctx.createBuffer(1, length, sr);
    const data = buf.getChannelData(0);
    let phase = 0;
    let curSlide = slide;
    let curFreq = frequency;
    let modOffset = 0;
    const repeatSamples = repeatTime > 0 ? Math.floor(repeatTime * sr) : 0;

    for (let i = 0; i < length; i++) {
      const t = i / sr;

      // Cyclic reset (laser/alarm effects)
      if (repeatSamples > 0 && i > 0 && i % repeatSamples === 0) {
        curFreq = frequency;
        curSlide = slide;
        phase = 0;
      }

      // ADSR amplitude envelope
      let amp;
      if (t < attack) {
        amp = attack > 0 ? t / attack : 1;
      } else if (t < attack + decay) {
        // Decay: lerp from 1 down to sustainVolume
        const decayProgress = decay > 0 ? (t - attack) / decay : 1;
        amp = 1 - (1 - sustainVolume) * decayProgress;
      } else if (t < attack + decay + sustain) {
        amp = sustainVolume;
      } else {
        amp = sustainVolume * Math.max(0, 1 - (t - attack - decay - sustain) / release);
      }

      // Tremolo
      if (tremolo > 0) amp *= 1 - tremolo * (0.5 + 0.5 * Math.sin(2 * Math.PI * 7 * t));

      // Frequency: pitch slide + acceleration + jump
      curSlide += deltaSlide / sr;
      curFreq *= Math.pow(2, curSlide / (sr * 12));
      const jumpOffset = t >= pitchJumpTime ? pitchJump : 0;
      const freq = curFreq * Math.pow(2, jumpOffset / 12);

      // FM modulation
      const modFreq = modulation > 0 ? freq * (1 + modulation * Math.cos(modOffset)) : freq;
      if (modulation > 0) modOffset += 0.01;

      phase = (phase + modFreq / sr) % 1;

      // Oscillator shape
      let s;
      switch (shape) {
        case 1:
          s = 1 - Math.abs(4 * phase - 2);
          break; // triangle
        case 2:
          s = 1 - 2 * phase;
          break; // sawtooth
        case 3:
          s = phase < 0.5 ? 1 : -1;
          break; // square
        case 4:
          s = Math.sin(Math.pow(2 * Math.PI * phase, 3));
          break; // noise-like
        case 5:
          s = Math.max(-1, Math.min(1, Math.tan(Math.PI * phase)));
          break; // tan
        default:
          s = Math.sin(2 * Math.PI * phase); // sine
      }

      // Shape curve (harmonic distortion)
      if (shapeCurve !== 1 && shapeCurve > 0) {
        s = (s >= 0 ? 1 : -1) * Math.pow(Math.abs(s), shapeCurve);
      }

      // Noise mix
      if (noise > 0) s += noise * (Math.random() * 2 - 1);

      // Bit crush
      if (bitCrush > 0) {
        const steps = Math.pow(2, Math.max(1, Math.round((1 - bitCrush) * 9)));
        s = Math.round(s * steps) / steps;
      }

      data[i] = amp * Math.max(-1, Math.min(1, s));
    }

    return buf;
  }
}

// ---- Controls companion component ----

export class WebAudioSynthBlipFXControls extends HTMLElement {
  static SLIDER_DEFS = [
    { param: "volume", label: "Vol", min: 0, max: 1, step: 0.01 },
    { param: "frequency", label: "Freq", min: 20, max: 2000, step: 1, scale: "log" },
    { param: "attack", label: "Attack", min: 0, max: 0.2, step: 0.001 },
    { param: "decay", label: "Decay", min: 0, max: 0.5, step: 0.01 },
    { param: "sustain", label: "Sustain", min: 0, max: 0.3, step: 0.01 },
    { param: "sustainVolume", label: "Sus Vol", min: 0, max: 1, step: 0.01 },
    { param: "release", label: "Release", min: 0.01, max: 1, step: 0.01 },
    { param: "slide", label: "Slide", min: -40, max: 40, step: 0.5 },
    { param: "deltaSlide", label: "Slide Accel", min: -30, max: 30, step: 0.5 },
    { param: "pitchJump", label: "P.Jump", min: -36, max: 36, step: 1 },
    { param: "pitchJumpTime", label: "Jump Time", min: 0, max: 0.3, step: 0.01 },
    { param: "repeatTime", label: "Repeat", min: 0, max: 0.5, step: 0.01 },
    { param: "noise", label: "Noise", min: 0, max: 1, step: 0.01 },
    { param: "modulation", label: "FM Mod", min: 0, max: 1, step: 0.01 },
    { param: "shapeCurve", label: "Shape Pwr", min: 0.1, max: 5, step: 0.1 },
    { param: "tremolo", label: "Tremolo", min: 0, max: 1, step: 0.01 },
    { param: "bitCrush", label: "BitCrush", min: 0, max: 1, step: 0.01 },
    { param: "lpfFreq", label: "LPF", min: 80, max: 8000, step: 1, scale: "log" },
    { param: "hpfFreq", label: "HPF", min: 20, max: 2000, step: 1, scale: "log" },
    { param: "lpfResonance", label: "Resonance", min: 0.5, max: 15, step: 0.1 },
    { param: "chance", label: "Chance", min: 0, max: 1, step: 0.01 },
  ];

  constructor() {
    super();
    this._instrument = null;
    this._ctx = null;
    this._sliders = {};
    this._presetSelect = null;
    this._shapeSelect = null;
    this._fxUnit = null;
    this._out = null;
    this._chance = 0.15;
    this._lastStep = -1;
  }

  bind(instrument, ctx, options = {}) {
    this._instrument = instrument;
    this._ctx = ctx;
    this._chance = options.chance ?? 0.15;
    const color = options.color || "#c0f";
    this.innerHTML = "";
    injectControlsCSS();
    this.style.setProperty("--slider-accent", color);
    this.style.setProperty("--fx-accent", color);

    this._muteHandle = createTitleWithMute(this, options.title || "BlipFX Sound Effects", () => this._out);

    const controls = document.createElement("div");
    controls.className = "wac-controls";
    this.appendChild(controls);

    // Preset dropdown
    this._presetSelect = document.createElement("select");
    this._presetSelect.className = "wac-select";
    Object.keys(WebAudioSynthBlipFX.PRESETS).forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      this._presetSelect.appendChild(opt);
    });
    this._presetSelect.addEventListener("change", () => {
      instrument.applyPreset(this._presetSelect.value);
      this._syncSliders();
      this._emitChange();
    });
    controls.appendChild(this._presetSelect);

    // Shape dropdown
    this._shapeSelect = document.createElement("select");
    this._shapeSelect.className = "wac-select";
    WebAudioSynthBlipFX.SHAPES.forEach((name, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = name;
      if (i === instrument.shape) opt.selected = true;
      this._shapeSelect.appendChild(opt);
    });
    this._shapeSelect.addEventListener("change", () => {
      instrument.shape = parseInt(this._shapeSelect.value);
      this._emitChange();
    });
    controls.appendChild(this._shapeSelect);

    // Sliders
    for (const def of WebAudioSynthBlipFXControls.SLIDER_DEFS) {
      const slider = document.createElement("web-audio-slider");
      slider.setAttribute("param", def.param);
      slider.setAttribute("label", def.label);
      slider.setAttribute("min", def.min);
      slider.setAttribute("max", def.max);
      slider.setAttribute("step", def.step);
      if (def.scale) slider.setAttribute("scale", def.scale);
      slider.value = def.param === "chance" ? this._chance : instrument[def.param];
      controls.appendChild(slider);
      this._sliders[def.param] = slider;
    }

    this.addEventListener("slider-input", (e) => {
      if (!this._instrument) return;
      if (e.detail.param === "chance") {
        this._chance = e.detail.value;
      } else {
        this._instrument[e.detail.param] = e.detail.value;
      }
      this._emitChange();
    });

    // Action row
    const actionRow = document.createElement("div");
    actionRow.className = "wac-action-row";

    const randPresetBtn = document.createElement("button");
    randPresetBtn.textContent = "⚄ Rand Preset";
    randPresetBtn.className = "wac-action-btn";
    randPresetBtn.addEventListener("click", () => {
      const names = Object.keys(WebAudioSynthBlipFX.PRESETS);
      const name = names[Math.floor(Math.random() * names.length)];
      instrument.applyPreset(name);
      if (this._presetSelect) this._presetSelect.value = name;
      this._syncSliders();
      this._emitChange();
    });
    actionRow.appendChild(randPresetBtn);

    const newBtn = document.createElement("button");
    newBtn.textContent = "⚄ Randomize";
    newBtn.className = "wac-action-btn";
    newBtn.addEventListener("click", () => {
      instrument.randomize();
      this._syncSliders();
      this._emitChange();
    });
    actionRow.appendChild(newBtn);

    const playBtn = document.createElement("button");
    playBtn.textContent = "▶ Play [V]";
    playBtn.className = "wac-action-btn";
    playBtn.addEventListener("click", () => this.triggerNow());
    actionRow.appendChild(playBtn);

    this.appendChild(actionRow);

    // FX unit
    this._fxUnit = document.createElement("web-audio-fx-unit");
    this.appendChild(this._fxUnit);
    this._fxUnit.init(ctx, { title: "SFX FX", bpm: options.fx?.bpm ?? 120, ...options.fx });

    // Waveform
    const waveform = document.createElement("web-audio-waveform");
    this.appendChild(waveform);

    const analyser = ctx.createAnalyser();
    instrument.connect(analyser);
    analyser.connect(this._fxUnit.input);
    this._out = ctx.createGain();
    this._fxUnit.connect(this._out);
    waveform.init(analyser, color);
  }

  /** Sync all slider values from the instrument's current params. */
  _syncSliders() {
    if (!this._instrument) return;
    for (const def of WebAudioSynthBlipFXControls.SLIDER_DEFS) {
      const slider = this._sliders[def.param];
      if (!slider) continue;
      if (def.param === "chance") {
        slider.value = this._chance;
      } else {
        slider.value = this._instrument[def.param];
      }
    }
    if (this._shapeSelect) this._shapeSelect.value = this._instrument.shape;
  }

  // ---- Sequencer integration ----

  /** Probabilistic trigger — fires on random steps based on chance slider. */
  step(index, time) {
    if (!this._instrument || index === this._lastStep) return;
    this._lastStep = index;
    if (Math.random() < this._chance) {
      this._instrument.randomize();
      this._syncSliders();
      this._instrument.trigger(time);
    }
  }

  setActiveStep() {
    /* no step grid to highlight */
  }
  setScale() {
    /* no-op — blipfx doesn't use note data */
  }

  /** Trigger a new random sound immediately. */
  triggerNow() {
    if (!this._instrument || !this._ctx) return;
    this._instrument.randomize();
    this._syncSliders();
    this._instrument.trigger(this._ctx.currentTime);
  }

  // ---- Serialization ----

  _emitChange() {
    this.dispatchEvent(new CustomEvent("controls-change", { bubbles: true }));
  }

  toJSON() {
    if (!this._instrument) return null;
    const params = {};
    for (const def of WebAudioSynthBlipFXControls.SLIDER_DEFS) {
      params[def.param] = def.param === "chance" ? this._chance : this._instrument[def.param];
    }
    params.shape = this._instrument.shape;
    return { params, fx: this._fxUnit?.toJSON(), muted: this._muteHandle?.isMuted() ?? false };
  }

  fromJSON(obj) {
    if (!obj || !this._instrument) return;
    if (obj.params) {
      for (const [key, val] of Object.entries(obj.params)) {
        if (key === "chance") {
          this._chance = val;
        } else {
          this._instrument[key] = val;
        }
        if (this._sliders[key]) this._sliders[key].value = val;
      }
      if (obj.params.shape != null && this._shapeSelect) {
        this._shapeSelect.value = obj.params.shape;
      }
    }
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

customElements.define("web-audio-synth-blipfx-controls", WebAudioSynthBlipFXControls);
