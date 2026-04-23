import DemoBase from "./demo--base-element.js";
import WebAudioSequencer from "../src/web-audio/web-audio-sequencer.js";
import WebAudioSynthAcid from "../src/web-audio/web-audio-synth-acid.js";
import WebAudioSynth808 from "../src/web-audio/web-audio-synth-808.js";
import WebAudioSynthZzfx from "../src/web-audio/web-audio-synth-zzfx.js";
import WebAudioBreakPlayer from "../src/web-audio-break-player.js";
import WebAudioFxUnit from "../src/web-audio/web-audio-fx-unit.js";
import WebAudioWaveform from "../src/web-audio/web-audio-waveform.js";
import WebAudioSynthFM from "../src/web-audio/web-audio-synth-fm.js";
import WebAudioStepSeq from "../src/web-audio/web-audio-step-seq.js";
import { SCALES, NOTE_NAMES, STEP_WEIGHTS, scaleNoteOptions, scaleNotesInRange, buildChordFromScale } from "../src/web-audio/web-audio-scales.js";

const BREAK_FILES = [
  { label: "— None —", file: "" },
  { label: "FunkyDrum (8 bars)", file: "0032-break-FUNKYDRUM_loop_8_.wav" },
  { label: "Shackup (16 bars)", file: "0033-break-shackup_loop_16_.wav" },
  { label: "Think (4 bars)", file: "0034-break-think.badsister_loop_4_.wav" },
  { label: "Hotpants (4 bars)", file: "0037_SamplepackHotpants_loop_4_.wav" },
];

const SPEED_MULTIPLIERS = [
  { label: "×0.5", value: 0.5 },
  { label: "×1", value: 1 },
  { label: "×2", value: 2 },
  { label: "×4", value: 4 },
];

class WebAudioAcid extends DemoBase {
  static meta = {
    title: "Web Audio Acid / TB-303",
    category: "Media",
    description: "TB-303 acid bass + 808 + ZzFX SFX with 16-step sequencer and break player",
  };

  init() {
    // Audio nodes
    this._ctx = null;
    this._masterGain = null;
    this._acid = null;
    this._808 = null;
    this._break = null;
    this._zzfx = null;
    // FX units — elements created in buildUI(), audio-initialized in _initAudio()
    this._acidFx = null;
    this._808Fx = null;
    this._breakFx = null;
    this._zzfxFx = null;
    // Waveform displays — created in buildUI(), init(analyser) called in _initAudio()
    this._acidWaveform = null;
    this._808Waveform = null;
    this._breakWaveform = null;
    this._zzfxWaveform = null;
    this._fmWaveform = null;
    this._seq = null;
    this._zzfxLastStep = -Infinity;
    this._pendingBreakSegment = -1;
    this._globalStep = 0;
    this._playing = false;
    // FM chord synth
    this._fmSynth = null;
    this._fmFx = null;

    this._p = {
      bpm: 128,
      // TB-303
      cutoff: 600,
      resonance: 18,
      envMod: 0.6,
      decay: 0.25,
      attack: 0.005,
      distortion: 0,
      portamento: 0,
      volume: 0.7,
      waveform: "sawtooth",
      // 808
      bass808Decay: 0.8,
      bass808PitchSweep: 24,
      bass808PitchDecay: 0.1,
      bass808Distortion: 0,
      bass808Volume: 0.8,
      bass808Click: 0.4,
      bass808SubMix: 0,
      bass808Tone: 3000,
      // Break
      breakSpeedMultiplier: 4,
      breakSubdivision: 4,
      breakReturnSteps: 1,
      breakRandomChance: 0.1,
      breakReverseChance: 0.04,
      breakVolume: 0.8,
      // ZzFX
      zzfxChance: 0.05,
      zzfxVolume: 0.5,
      zzfxLpfFreq: 1200,
      zzfxHpfFreq: 80,
      zzfxLpfResonance: 1,
      // FM Chord Synth
      fmCarrierRatio: 1,
      fmModRatio: 2,
      fmModIndex: 2,
      fmModDecay: 0.25,
      fmAttack: 0.02,
      fmDecay: 0.4,
      fmSustain: 0.3,
      fmRelease: 0.6,
      fmFilterFreq: 5000,
      fmFilterQ: 1,
      fmDetune: 0,
      fmVolume: 0.4,
      fmChordSize: 3,
    };

    this._breakFileSelect = null;
    this._pendingAcidNote = null;
    // Sequencer web components (created in buildUI)
    this._acidSeq = null;
    this._808Seq = null;
    this._chordSeq = null;
    this._fmSliderInputs = {};
    this._acidSliderInputs = {};
    this._808SliderInputs = {};
    this._fmPresetSelect = null;

    this.buildUI();
    this.addCSS();
    this._setupKeyboardJam();
  }

  _defaultPattern() {
    // F1-rooted acid pattern
    const notes = [29, 29, 36, 29, 34, 29, 36, 41, 29, 36, 34, 29, 32, 34, 36, 29];
    const active = new Set([0, 2, 4, 6, 7, 9, 11, 12, 14]);
    const accent = new Set([0, 7, 12]);
    return notes.map((note, i) => ({ active: active.has(i), note, accent: accent.has(i) }));
  }

  _default808Pattern() {
    // Kicks on beats 1 and 3, F1 (MIDI 29)
    return Array.from({ length: 16 }, (_, i) => ({ active: i === 0 || i === 8, note: 29 }));
  }

  // ---- Audio ----

  _initAudio() {
    if (this._ctx) return;
    this._ctx = new AudioContext();

    this._masterGain = this._ctx.createGain();
    this._masterGain.gain.value = 1.0;
    this._masterGain.connect(this._ctx.destination);

    // TB-303 acid → its fx unit → master
    this._acid = new WebAudioSynthAcid(this._ctx, {
      cutoff: this._p.cutoff,
      resonance: this._p.resonance,
      envMod: this._p.envMod,
      decay: this._p.decay,
      attack: this._p.attack,
      distortion: this._p.distortion,
      portamento: this._p.portamento,
      volume: this._p.volume,
      oscType: this._p.waveform,
    });
    this._acidFx.init(this._ctx, {
      title: "Acid FX",
      bpm: this._p.bpm,
      reverbWet: 0.15,
      delayInterval: 0.75,
      delayFeedback: 0.35,
      delayMix: 0,
    });
    this._acid.connect(this._acidFx);
    this._acidFx.connect(this._masterGain);
    const acidAnalyser = this._ctx.createAnalyser();
    this._acid.connect(acidAnalyser);
    this._acidWaveform.init(acidAnalyser, "#0f0");

    // 808 → its fx unit → master
    this._808 = new WebAudioSynth808(this._ctx, {
      pitchSweepSemitones: this._p.bass808PitchSweep,
      pitchDecay: this._p.bass808PitchDecay,
      decay: this._p.bass808Decay,
      distortion: this._p.bass808Distortion,
      volume: this._p.bass808Volume,
      click: this._p.bass808Click,
      subOscMix: this._p.bass808SubMix,
      tone: this._p.bass808Tone,
    });
    this._808Fx.init(this._ctx, { title: "808 FX", bpm: this._p.bpm });
    this._808.connect(this._808Fx);
    this._808Fx.connect(this._masterGain);
    const analyser808 = this._ctx.createAnalyser();
    this._808.connect(analyser808);
    this._808Waveform.init(analyser808, "#fa0");

    // Break → its fx unit → master
    this._break = new WebAudioBreakPlayer(this._ctx, {
      speedMultiplier: this._p.breakSpeedMultiplier,
      subdivision: this._p.breakSubdivision,
      returnSteps: this._p.breakReturnSteps,
      randomChance: this._p.breakRandomChance,
      reverseChance: this._p.breakReverseChance,
      volume: this._p.breakVolume,
    });
    this._breakFx.init(this._ctx, { title: "Break FX", bpm: this._p.bpm });
    this._break.connect(this._breakFx);
    this._breakFx.connect(this._masterGain);
    const breakAnalyser = this._ctx.createAnalyser();
    this._break.connect(breakAnalyser);
    this._breakWaveform.init(breakAnalyser, "#0cc");
    this._loadBreak();

    // ZzFX → its fx unit → master
    this._zzfx = new WebAudioSynthZzfx(this._ctx, {
      volume: this._p.zzfxVolume,
      lpfFreq: this._p.zzfxLpfFreq,
      hpfFreq: this._p.zzfxHpfFreq,
      lpfResonance: this._p.zzfxLpfResonance,
    });
    this._zzfxFx.init(this._ctx, { title: "SFX FX", bpm: this._p.bpm });
    this._zzfx.connect(this._zzfxFx);
    this._zzfxFx.connect(this._masterGain);
    const zzfxAnalyser = this._ctx.createAnalyser();
    this._zzfx.connect(zzfxAnalyser);
    this._zzfxWaveform.init(zzfxAnalyser, "#c0f");

    // FM Chord Synth → its fx unit → master
    this._fmSynth = new WebAudioSynthFM(this._ctx, {
      carrierRatio: this._p.fmCarrierRatio,
      modRatio:     this._p.fmModRatio,
      modIndex:     this._p.fmModIndex,
      modDecay:     this._p.fmModDecay,
      attack:       this._p.fmAttack,
      decay:        this._p.fmDecay,
      sustain:      this._p.fmSustain,
      release:      this._p.fmRelease,
      filterFreq:   this._p.fmFilterFreq,
      filterQ:      this._p.fmFilterQ,
      detune:       this._p.fmDetune,
      volume:       this._p.fmVolume,
    });
    this._fmFx.init(this._ctx, {
      title: "FM FX",
      bpm: this._p.bpm,
      reverbWet: 0.2,
      delayInterval: 0.5,
      delayFeedback: 0.4,
      delayMix: 0.1,
    });
    this._fmSynth.connect(this._fmFx);
    this._fmFx.connect(this._masterGain);
    const fmAnalyser = this._ctx.createAnalyser();
    this._fmSynth.connect(fmAnalyser);
    this._fmWaveform.init(fmAnalyser, "#4af");

    // Sequencer
    this._seq = new WebAudioSequencer(this._ctx, {
      bpm: this._p.bpm,
      steps: 16,
      subdivision: 16,
    });
    this._seq.onStep((step, time) => {
      // TB-303
      const acidSteps = this._acidSeq?.steps ?? [];
      const acidStep = acidSteps[step];
      if (acidStep?.active) {
        this._acid.trigger(acidStep.note, this._seq.stepDurationSec(), acidStep.accent, time);
      }
      // Manual acid note queued by [B] key / button
      if (this._pendingAcidNote !== null) {
        this._acid.trigger(this._pendingAcidNote, this._seq.stepDurationSec(), false, time);
        this._pendingAcidNote = null;
      }
      // 808
      const seq808Steps = this._808Seq?.steps ?? [];
      const bass808Step = seq808Steps[step];
      if (bass808Step?.active) {
        this._808.trigger(bass808Step.note, this._seq.stepDurationSec(), time);
      }
      // Break — manual segment queued by jam buttons takes priority
      if (this._break.loaded) {
        if (this._pendingBreakSegment >= 0) {
          this._break.jumpToSegment(this._pendingBreakSegment, 3, this._p.bpm, time);
          this._pendingBreakSegment = -1;
        } else {
          this._break.trigger(this._globalStep, this._p.bpm, time);
        }
      }
      // ZzFX — occasional random squelch, 2-measure cooldown between hits
      const zzfxReady = this._globalStep - this._zzfxLastStep >= 32;
      if (zzfxReady && Math.random() < this._p.zzfxChance) {
        this._zzfx.randomize();
        this._zzfx.trigger(time);
        this._zzfxLastStep = this._globalStep;
      }
      // FM Chord — trigger when step is active, using that step's root note
      const chordSteps = this._chordSeq?.steps ?? [];
      const chordStep = chordSteps[step];
      if (chordStep?.active) {
        const chord = this._buildChordFromScale(chordStep.note, this._scaleSelect.value, this._p.fmChordSize);
        this._fmSynth.trigger(chord, this._seq.stepDurationSec(), time);
      }

      const uiDelay = Math.max(0, (time - this._ctx.currentTime) * 1000);
      setTimeout(() => this._highlightStep(step), uiDelay);
      this._globalStep++;
    });
  }

  _loadBreak() {
    if (!this._ctx || !this._break || !this._breakFileSelect) return;
    const file = this._breakFileSelect.value;
    if (file) this._break.load(`../data/audio/breaks/${file}`);
    else this._break.stop();
  }

  _play() {
    this._initAudio();
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
    this._highlightStep(-1);
    this._playBtn.textContent = "▶ Play";
  }

  _highlightStep(i) {
    this._acidSeq?.setActiveStep(i);
    this._808Seq?.setActiveStep(i);
    this._chordSeq?.setActiveStep(i);
  }

  // ---- Randomizer ----

  _buildScaleNotes(rootMidi, scaleName) {
    return scaleNotesInRange(rootMidi, scaleName, 24, 60);
  }

  _randomize() {
    const root = parseInt(this._rootSelect.value);
    const notes = this._buildScaleNotes(root, this._scaleSelect.value);
    const pool = notes.flatMap((n) => {
      const octaveAbove = Math.floor((n - root) / 12);
      const weight = Math.max(1, 4 - octaveAbove * 2) + (n === root || n === root + 12 ? 2 : 0);
      return Array(weight).fill(n);
    });

    let prevNote = root;
    const newSteps = Array.from({ length: 16 }, (_, i) => {
      const active = Math.random() < STEP_WEIGHTS[i];
      const nearby = pool.filter((n) => Math.abs(n - prevNote) <= 7);
      const src = nearby.length >= 3 ? nearby : pool;
      const note = src[Math.floor(Math.random() * src.length)];
      if (active) prevNote = note;
      const accent = [0, 4, 8, 12].includes(i) && Math.random() < 0.4;
      return { active, note, accent };
    });
    newSteps[0] = { active: true, note: root, accent: Math.random() < 0.5 };
    if (this._acidSeq) this._acidSeq.steps = newSteps;
  }

  _queueRandomAcidNote() {
    const root = parseInt(this._rootSelect?.value ?? 29);
    const notes = this._buildScaleNotes(root, this._scaleSelect?.value ?? "Minor");
    if (!notes.length) return;
    this._pendingAcidNote = notes[Math.floor(Math.random() * notes.length)];
  }

  _defaultChordPattern() {
    // Just downbeats — very sparse so chords don't crowd the mix
    const active = new Set([0, 8]);
    return Array.from({ length: 16 }, (_, i) => ({ active: active.has(i), note: 29 }));
  }

  _buildChordFromScale(rootMidi, scaleName, size) {
    return buildChordFromScale(rootMidi + 24, scaleName, size);
  }

  _triggerJamChord() {
    if (!this._fmSynth || !this._ctx) return;
    const root = parseInt(this._rootSelect.value);
    const chord = this._buildChordFromScale(root, this._scaleSelect.value, this._p.fmChordSize);
    this._fmSynth.trigger(chord, this._seq?.stepDurationSec() ?? 0.25, this._ctx.currentTime);
  }

  _applyAcidPreset(presetName) {
    const preset = WebAudioSynthAcid.PRESETS[presetName];
    if (!preset) return;
    const paramMap = {
      cutoff: "cutoff", resonance: "resonance", envMod: "envMod", decay: "decay",
      attack: "attack", distortion: "distortion", portamento: "portamento",
      volume: "volume", oscType: "waveform",
    };
    Object.entries(preset).forEach(([key, val]) => {
      const param = paramMap[key] ?? key;
      this._p[param] = val;
      const input = this._acidSliderInputs[param];
      if (input) {
        input.value = val;
        const step = parseFloat(input.step);
        const span = input.closest(".acid-ctrl")?.querySelector(".acid-ctrl-val");
        if (span) span.textContent = step < 0.1 ? val.toFixed(3) : step < 1 ? val.toFixed(2) : Math.round(val);
      }
    });
    if (this._acid) this._acid.applyPreset(presetName);
    // Update waveform buttons
    if (preset.oscType) {
      this.el.querySelectorAll(".acid-wave-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.textContent === (preset.oscType === "sawtooth" ? "SAW" : "SQR"));
      });
    }
  }

  _apply808Preset(presetName) {
    const preset = WebAudioSynth808.PRESETS[presetName];
    if (!preset) return;
    const paramMap = {
      pitchSweepSemitones: "bass808PitchSweep", pitchDecay: "bass808PitchDecay",
      decay: "bass808Decay", distortion: "bass808Distortion", click: "bass808Click",
      subOscMix: "bass808SubMix", tone: "bass808Tone", volume: "bass808Volume",
    };
    Object.entries(preset).forEach(([key, val]) => {
      const param = paramMap[key] ?? key;
      this._p[param] = val;
      const input = this._808SliderInputs[param];
      if (input) {
        input.value = val;
        const step = parseFloat(input.step);
        const span = input.closest(".acid-ctrl")?.querySelector(".acid-ctrl-val");
        if (span) span.textContent = step < 0.1 ? val.toFixed(3) : step < 1 ? val.toFixed(2) : Math.round(val);
      }
    });
    if (this._808) this._808.applyPreset(presetName);
  }

  _applyFmPreset(presetName) {
    const preset = WebAudioSynthFM.PRESETS[presetName];
    if (!preset) return;
    Object.entries(preset).forEach(([key, val]) => {
      const param = WebAudioSynthFM.PARAM_KEY_MAP[key] ?? key;
      this._p[param] = val;
      const input = this._fmSliderInputs[param];
      if (input) {
        input.value = val;
        const step = parseFloat(input.step);
        const span = input.closest(".acid-ctrl")?.querySelector(".acid-ctrl-val");
        if (span) span.textContent = step < 0.1 ? val.toFixed(3) : step < 1 ? val.toFixed(2) : Math.round(val);
      }
    });
    if (this._fmSynth) this._fmSynth.applyPreset(presetName);
  }

  _refreshChordSeqUI() {
    // No-op — _chordSeq component manages its own display.
    // Retained for compatibility with callers; use _chordSeq.steps setter directly.
  }

  _randomizeFm() {
    // Random preset
    const presetNames = Object.keys(WebAudioSynthFM.PRESETS);
    const presetName = presetNames[Math.floor(Math.random() * presetNames.length)];
    this._applyFmPreset(presetName);
    if (this._fmPresetSelect) this._fmPresetSelect.value = presetName;

    // Random chord steps: sparse (1–3 active), notes from current scale
    const root = parseInt(this._rootSelect.value);
    const scaleNotes = this._buildScaleNotes(root, this._scaleSelect.value);
    const numActive = 1 + Math.floor(Math.random() * 3);
    const activeSet = new Set([0]); // always keep beat 1
    while (activeSet.size < numActive) activeSet.add(Math.floor(Math.random() * 16));
    const newChordSteps = Array.from({ length: 16 }, (_, i) => ({
      active: activeSet.has(i),
      note: scaleNotes[Math.floor(Math.random() * scaleNotes.length)],
    }));
    if (this._chordSeq) this._chordSeq.steps = newChordSteps;
  }

  _setupKeyboardJam() {
    document.addEventListener("keydown", (e) => {
      // Don't hijack key presses while typing in inputs / selects
      if (["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
      switch (e.key.toLowerCase()) {
        case "z":
          this._pendingBreakSegment = 0;
          break;
        case "x":
          this._pendingBreakSegment = 1;
          break;
        case "c":
          this._pendingBreakSegment = 2;
          break;
        case "v":
          if (!this._zzfx) return;
          this._zzfx.randomize();
          this._zzfx.trigger(this._ctx.currentTime);
          break;
        case "b":
          this._queueRandomAcidNote();
          break;
        case "n":
          this._triggerJamChord();
          break;
      }
    });
  }

  // ---- UI ----

  buildUI() {
    // Transport
    const transport = this.injectHTML(`<div class="acid-transport"></div>`);
    this._playBtn = document.createElement("button");
    this._playBtn.textContent = "▶ Play";
    this._playBtn.className = "acid-play";
    this._playBtn.addEventListener("click", () => (this._playing ? this._stop() : this._play()));
    transport.appendChild(this._playBtn);
    transport.appendChild(this._makeSlider("BPM", "bpm", 60, 200, 1, this._p.bpm));

    // Global scale selects — shared by all instruments (acid randomizer, chord synth, etc.)
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
    this._rootSelect.addEventListener("change", () => this._updateAllNoteSelects());
    this._scaleSelect.addEventListener("change", () => this._updateAllNoteSelects());
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

    // ---- Break group ----
    const breakGroup = this.injectHTML(`<div class="instrument-group break-group"></div>`);
    const breakRow = document.createElement("div");
    breakRow.className = "acid-controls break-controls";
    breakRow.appendChild(
      Object.assign(document.createElement("div"), { className: "acid-section-title", textContent: "Break Player" }),
    );

    const fileWrap = document.createElement("div");
    fileWrap.className = "acid-ctrl acid-ctrl-wide";
    fileWrap.appendChild(Object.assign(document.createElement("label"), { textContent: "Loop" }));
    this._breakFileSelect = document.createElement("select");
    this._breakFileSelect.className = "acid-select";
    BREAK_FILES.forEach(({ label, file }) => {
      const opt = document.createElement("option");
      opt.value = file;
      opt.textContent = label;
      this._breakFileSelect.appendChild(opt);
    });
    this._breakFileSelect.addEventListener("change", () => {
      this._p.breakFile = this._breakFileSelect.value;
      this._loadBreak();
    });
    fileWrap.appendChild(this._breakFileSelect);
    breakRow.appendChild(fileWrap);

    const speedWrap = document.createElement("div");
    speedWrap.className = "acid-ctrl";
    speedWrap.appendChild(Object.assign(document.createElement("label"), { textContent: "Speed" }));
    const speedSelect = document.createElement("select");
    speedSelect.className = "acid-select";
    SPEED_MULTIPLIERS.forEach(({ label, value }) => {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      if (value === this._p.breakSpeedMultiplier) opt.selected = true;
      speedSelect.appendChild(opt);
    });
    speedSelect.addEventListener("change", () => {
      const v = parseFloat(speedSelect.value);
      this._p.breakSpeedMultiplier = v;
      if (this._break) this._break.speedMultiplier = v;
    });
    speedWrap.appendChild(speedSelect);
    breakRow.appendChild(speedWrap);

    const subdivWrap = document.createElement("div");
    subdivWrap.className = "acid-ctrl";
    subdivWrap.appendChild(Object.assign(document.createElement("label"), { textContent: "Jump Grid" }));
    const subdivSelect = document.createElement("select");
    subdivSelect.className = "acid-select";
    [4, 8, 16].forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = `÷${v}`;
      if (v === this._p.breakSubdivision) opt.selected = true;
      subdivSelect.appendChild(opt);
    });
    subdivSelect.addEventListener("change", () => {
      const v = parseInt(subdivSelect.value);
      this._p.breakSubdivision = v;
      if (this._break) this._break.subdivision = v;
    });
    subdivWrap.appendChild(subdivSelect);
    breakRow.appendChild(subdivWrap);

    const returnWrap = document.createElement("div");
    returnWrap.className = "acid-ctrl";
    returnWrap.appendChild(Object.assign(document.createElement("label"), { textContent: "Return" }));
    const returnSelect = document.createElement("select");
    returnSelect.className = "acid-select";
    [
      [1, "1 step"],
      [2, "2 steps"],
      [4, "4 steps"],
      [8, "8 steps"],
      [16, "16 steps"],
    ].forEach(([v, lbl]) => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = lbl;
      if (v === this._p.breakReturnSteps) opt.selected = true;
      returnSelect.appendChild(opt);
    });
    returnSelect.addEventListener("change", () => {
      const v = parseInt(returnSelect.value);
      this._p.breakReturnSteps = v;
      if (this._break) this._break.returnSteps = v;
    });
    returnWrap.appendChild(returnSelect);
    breakRow.appendChild(returnWrap);

    breakRow.appendChild(this._makeSlider("Rand Chance", "breakRandomChance", 0, 1, 0.01, this._p.breakRandomChance));
    breakRow.appendChild(this._makeSlider("Reverse", "breakReverseChance", 0, 0.25, 0.01, this._p.breakReverseChance));
    breakRow.appendChild(this._makeSlider("Vol", "breakVolume", 0, 1, 0.01, this._p.breakVolume));

    // Jam buttons — queue a segment jump for the next sequencer step
    const jamWrap = document.createElement("div");
    jamWrap.className = "acid-ctrl break-jam-ctrl";
    jamWrap.appendChild(Object.assign(document.createElement("label"), { textContent: "Jam" }));
    const jamBtns = document.createElement("div");
    jamBtns.className = "break-jam-btns";
    [
      ["K", 0, "Z"],
      ["H", 1, "X"],
      ["S", 2, "C"],
    ].forEach(([label, seg, key]) => {
      const btn = document.createElement("button");
      btn.textContent = `${label} [${key}]`;
      btn.className = "break-jam-btn";
      btn.addEventListener("mousedown", () => {
        this._pendingBreakSegment = seg;
      });
      jamBtns.appendChild(btn);
    });
    jamWrap.appendChild(jamBtns);
    breakRow.appendChild(jamWrap);

    this._breakFx = document.createElement("web-audio-fx-unit");
    this._breakWaveform = document.createElement("web-audio-waveform");
    breakGroup.appendChild(breakRow);
    breakGroup.appendChild(this._breakFx);
    breakGroup.appendChild(this._breakWaveform);

    // ---- 808 group ----
    const g808 = this.injectHTML(`<div class="instrument-group bass808-group"></div>`);
    const bass808Row = document.createElement("div");
    bass808Row.className = "acid-controls bass808-controls";
    bass808Row.appendChild(
      Object.assign(document.createElement("div"), { className: "acid-section-title", textContent: "808 Bass" }),
    );

    // 808 preset select
    this._808PresetSelect = document.createElement("select");
    this._808PresetSelect.className = "acid-select";
    Object.keys(WebAudioSynth808.PRESETS).forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      this._808PresetSelect.appendChild(opt);
    });
    this._808PresetSelect.addEventListener("change", () => this._apply808Preset(this._808PresetSelect.value));
    bass808Row.appendChild(this._808PresetSelect);

    // Helper: append a slider and store its input for preset updates
    const bass808Slider = (label, param, min, max, step) => {
      const wrap = this._makeSlider(label, param, min, max, step, this._p[param]);
      this._808SliderInputs[param] = wrap.querySelector("input[type=range]");
      bass808Row.appendChild(wrap);
    };
    bass808Slider("Decay", "bass808Decay", 0.1, 3, 0.01);
    bass808Slider("Pitch Sweep", "bass808PitchSweep", 0, 36, 1);
    bass808Slider("Pitch Decay", "bass808PitchDecay", 0.01, 1, 0.01);
    bass808Slider("Distortion", "bass808Distortion", 0, 1, 0.01);
    bass808Slider("Vol", "bass808Volume", 0, 1, 0.01);
    bass808Slider("Click", "bass808Click", 0, 1, 0.01);
    bass808Slider("Sub Mix", "bass808SubMix", 0, 1, 0.01);
    bass808Slider("Tone", "bass808Tone", 50, 8000, 1);

    this._808Seq = document.createElement("web-audio-step-seq");
    const note808Opts = scaleNoteOptions(parseInt(this._rootSelect.value), this._scaleSelect.value, 24, 48);
    this._808Seq.init({
      steps: this._default808Pattern(),
      noteOptions: note808Opts,
      color: "#fa0",
    });

    this._808Fx = document.createElement("web-audio-fx-unit");
    this._808Waveform = document.createElement("web-audio-waveform");
    g808.appendChild(bass808Row);
    g808.appendChild(this._808Seq);
    g808.appendChild(this._808Fx);
    g808.appendChild(this._808Waveform);

    // ---- FM Chord group ----
    const fmGroup = this.injectHTML(`<div class="instrument-group chord-fm-group"></div>`);
    const fmRow = document.createElement("div");
    fmRow.className = "acid-controls chord-fm-controls";
    fmRow.appendChild(
      Object.assign(document.createElement("div"), { className: "acid-section-title", textContent: "FM Chord Synth" }),
    );
    // Helper: append a slider and store its input element for preset updates
    const fmSlider = (label, param, min, max, step) => {
      const wrap = this._makeSlider(label, param, min, max, step, this._p[param]);
      this._fmSliderInputs[param] = wrap.querySelector("input[type=range]");
      fmRow.appendChild(wrap);
    };
    fmSlider("Carrier R",  "fmCarrierRatio", 0.5, 4,     0.01);
    fmSlider("Mod Ratio",  "fmModRatio",     0.5, 8,     0.01);
    fmSlider("Mod Index",  "fmModIndex",     0,   10,    0.1);
    fmSlider("Mod Decay",  "fmModDecay",     0.01, 2,    0.01);
    fmSlider("Attack",     "fmAttack",       0.001, 1,   0.001);
    fmSlider("Decay",      "fmDecay",        0.01, 2,    0.01);
    fmSlider("Sustain",    "fmSustain",      0,   1,     0.01);
    fmSlider("Release",    "fmRelease",      0.01, 3,    0.01);
    fmSlider("Filter",     "fmFilterFreq",   100, 12000, 1);
    fmSlider("Filter Q",   "fmFilterQ",      0.5, 20,    0.1);
    fmSlider("Detune",     "fmDetune",       -50, 50,    1);
    fmSlider("Vol",        "fmVolume",       0,   1,     0.01);

    const chordSizeWrap = document.createElement("div");
    chordSizeWrap.className = "acid-ctrl";
    chordSizeWrap.appendChild(Object.assign(document.createElement("label"), { textContent: "Chord Size" }));
    const chordSizeSelect = document.createElement("select");
    chordSizeSelect.className = "acid-select";
    [2, 3, 4].forEach((n) => {
      const opt = document.createElement("option");
      opt.value = n;
      opt.textContent = `${n} notes`;
      if (n === this._p.fmChordSize) opt.selected = true;
      chordSizeSelect.appendChild(opt);
    });
    chordSizeSelect.addEventListener("change", () => {
      this._p.fmChordSize = parseInt(chordSizeSelect.value);
    });
    chordSizeWrap.appendChild(chordSizeSelect);
    fmRow.appendChild(chordSizeWrap);

    // FM chord step sequencer (on/off + root note — chord built from note + global scale)
    this._chordSeq = document.createElement("web-audio-step-seq");
    const chordNoteOpts = scaleNoteOptions(parseInt(this._rootSelect.value), this._scaleSelect.value, 24, 48);
    this._chordSeq.init({
      steps: this._defaultChordPattern(),
      noteOptions: chordNoteOpts,
      color: "#4af",
    });

    const fmJamRow = document.createElement("div");
    fmJamRow.className = "acid-rand-row";

    // Preset select
    const presetNames = Object.keys(WebAudioSynthFM.PRESETS);
    this._fmPresetSelect = document.createElement("select");
    this._fmPresetSelect.className = "acid-select";
    presetNames.forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      this._fmPresetSelect.appendChild(opt);
    });
    this._fmPresetSelect.addEventListener("change", () => this._applyFmPreset(this._fmPresetSelect.value));
    fmJamRow.appendChild(this._fmPresetSelect);

    // Random preset button
    const fmRandBtn = document.createElement("button");
    fmRandBtn.textContent = "⚄ Preset";
    fmRandBtn.className = "acid-rand-btn chord-fm-rand-btn";
    fmRandBtn.addEventListener("click", () => {
      const idx = Math.floor(Math.random() * presetNames.length);
      this._fmPresetSelect.value = presetNames[idx];
      this._applyFmPreset(presetNames[idx]);
    });
    fmJamRow.appendChild(fmRandBtn);

    // Full randomize button — preset + sequencer positions + notes
    const fmFullRandBtn = document.createElement("button");
    fmFullRandBtn.textContent = "⚄ Randomize";
    fmFullRandBtn.className = "acid-rand-btn chord-fm-rand-btn";
    fmFullRandBtn.addEventListener("click", () => this._randomizeFm());
    fmJamRow.appendChild(fmFullRandBtn);

    const fmChordBtn = document.createElement("button");
    fmChordBtn.textContent = "♫ Chord [N]";
    fmChordBtn.className = "acid-rand-btn chord-fm-rand-btn";
    fmChordBtn.addEventListener("click", () => {
      this._initAudio();
      if (this._ctx.state === "suspended") this._ctx.resume();
      this._triggerJamChord();
    });
    fmJamRow.appendChild(fmChordBtn);

    this._fmFx = document.createElement("web-audio-fx-unit");
    this._fmWaveform = document.createElement("web-audio-waveform");
    fmGroup.appendChild(fmRow);
    fmGroup.appendChild(this._chordSeq);
    fmGroup.appendChild(fmJamRow);
    fmGroup.appendChild(this._fmFx);
    fmGroup.appendChild(this._fmWaveform);

    // ---- ZzFX group ----
    const zzfxGroup = this.injectHTML(`<div class="instrument-group zzfx-group"></div>`);
    const zzfxRow = document.createElement("div");
    zzfxRow.className = "acid-controls zzfx-controls";
    zzfxRow.appendChild(
      Object.assign(document.createElement("div"), {
        className: "acid-section-title",
        textContent: "ZzFX Sound Effects",
      }),
    );

    const zzfxRandBtn = document.createElement("button");
    zzfxRandBtn.textContent = "⚄ New SFX";
    zzfxRandBtn.className = "acid-rand-btn zzfx-rand-btn";
    zzfxRandBtn.addEventListener("click", () => this._zzfx?.randomize());
    zzfxRow.appendChild(zzfxRandBtn);

    const zzfxTriggerBtn = document.createElement("button");
    zzfxTriggerBtn.textContent = "▶ Play [V]";
    zzfxTriggerBtn.className = "acid-rand-btn zzfx-rand-btn";
    zzfxTriggerBtn.addEventListener("click", () => {
      this._initAudio();
      if (this._ctx.state === "suspended") this._ctx.resume();
      this._zzfx.randomize();
      this._zzfx.trigger(this._ctx.currentTime);
    });
    zzfxRow.appendChild(zzfxTriggerBtn);

    zzfxRow.appendChild(this._makeSlider("Chance", "zzfxChance", 0, 0.5, 0.01, this._p.zzfxChance));
    zzfxRow.appendChild(this._makeSlider("Vol", "zzfxVolume", 0, 1, 0.01, this._p.zzfxVolume));
    zzfxRow.appendChild(this._makeSlider("LPF", "zzfxLpfFreq", 80, 8000, 1, this._p.zzfxLpfFreq));
    zzfxRow.appendChild(this._makeSlider("HPF", "zzfxHpfFreq", 20, 2000, 1, this._p.zzfxHpfFreq));
    zzfxRow.appendChild(this._makeSlider("Resonance", "zzfxLpfResonance", 0.5, 15, 0.1, this._p.zzfxLpfResonance));

    this._zzfxFx = document.createElement("web-audio-fx-unit");
    this._zzfxWaveform = document.createElement("web-audio-waveform");
    zzfxGroup.appendChild(zzfxRow);
    zzfxGroup.appendChild(this._zzfxFx);
    zzfxGroup.appendChild(this._zzfxWaveform);

    // ---- Acid / TB-303 group ----
    const acidGroup = this.injectHTML(`<div class="instrument-group acid-group"></div>`);
    const controls = document.createElement("div");
    controls.className = "acid-controls";
    controls.appendChild(
      Object.assign(document.createElement("div"), { className: "acid-section-title", textContent: "TB-303 Acid" }),
    );

    const waveRow = document.createElement("div");
    waveRow.className = "acid-wave-row";
    waveRow.appendChild(Object.assign(document.createElement("span"), { textContent: "Waveform" }));
    ["sawtooth", "square"].forEach((type) => {
      const btn = document.createElement("button");
      btn.textContent = type === "sawtooth" ? "SAW" : "SQR";
      btn.className = `acid-wave-btn${type === this._p.waveform ? " active" : ""}`;
      btn.addEventListener("click", () => {
        this._p.waveform = type;
        if (this._acid) this._acid.oscType = type;
        waveRow.querySelectorAll(".acid-wave-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
      waveRow.appendChild(btn);
    });
    controls.appendChild(waveRow);

    // Helper: append a slider and store its input for preset updates
    const acidSlider = (label, param, min, max, step) => {
      const wrap = this._makeSlider(label, param, min, max, step, this._p[param]);
      this._acidSliderInputs[param] = wrap.querySelector("input[type=range]");
      controls.appendChild(wrap);
    };
    acidSlider("Cutoff", "cutoff", 50, 10000, 1);
    acidSlider("Resonance", "resonance", 0.1, 30, 0.1);
    acidSlider("Env Mod", "envMod", 0, 1, 0.01);
    acidSlider("Decay", "decay", 0.01, 2, 0.01);
    acidSlider("Attack", "attack", 0.001, 0.3, 0.001);
    acidSlider("Distortion", "distortion", 0, 1, 0.01);
    acidSlider("Portamento", "portamento", 0, 0.5, 0.001);
    acidSlider("Vol", "volume", 0, 1, 0.01);

    this._acidFx = document.createElement("web-audio-fx-unit");

    // Randomizer
    const randRow = document.createElement("div");
    randRow.className = "acid-rand-row";

    // 303 preset select
    this._acidPresetSelect = document.createElement("select");
    this._acidPresetSelect.className = "acid-select";
    Object.keys(WebAudioSynthAcid.PRESETS).forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      this._acidPresetSelect.appendChild(opt);
    });
    this._acidPresetSelect.addEventListener("change", () => this._applyAcidPreset(this._acidPresetSelect.value));
    randRow.appendChild(this._acidPresetSelect);

    const randBtn = document.createElement("button");
    randBtn.textContent = "⚄ Randomize";
    randBtn.className = "acid-rand-btn";
    randBtn.addEventListener("click", () => this._randomize());
    const noteBtn = document.createElement("button");
    noteBtn.textContent = "♩ Note [B]";
    noteBtn.className = "acid-rand-btn";
    noteBtn.addEventListener("click", () => this._queueRandomAcidNote());
    randRow.appendChild(randBtn);
    randRow.appendChild(noteBtn);

    // 303 step sequencer
    this._acidSeq = document.createElement("web-audio-step-seq");
    const acidNoteOpts = scaleNoteOptions(parseInt(this._rootSelect.value), this._scaleSelect.value, 24, 60);
    this._acidSeq.init({
      steps: this._defaultPattern(),
      noteOptions: acidNoteOpts,
      accent: true,
      color: "#0f0",
    });

    this._acidWaveform = document.createElement("web-audio-waveform");
    acidGroup.appendChild(controls);
    acidGroup.appendChild(this._acidFx);
    acidGroup.appendChild(randRow);
    acidGroup.appendChild(this._acidSeq);
    acidGroup.appendChild(this._acidWaveform);
  }

  _updateAllNoteSelects() {
    const root = parseInt(this._rootSelect.value);
    const scale = this._scaleSelect.value;
    this._acidSeq?.setNoteOptions(scaleNoteOptions(root, scale, 24, 60));
    this._808Seq?.setNoteOptions(scaleNoteOptions(root, scale, 24, 48));
    this._chordSeq?.setNoteOptions(scaleNoteOptions(root, scale, 24, 48));
  }

  _makeSlider(label, param, min, max, step, value) {
    const wrap = document.createElement("div");
    wrap.className = "acid-ctrl";

    const lbl = document.createElement("label");
    const valSpan = document.createElement("span");
    valSpan.className = "acid-ctrl-val";
    valSpan.textContent = step < 0.1 ? value.toFixed(3) : step < 1 ? value.toFixed(2) : Math.round(value);
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
      this._p[param] = v;
      valSpan.textContent = step < 0.1 ? v.toFixed(3) : step < 1 ? v.toFixed(2) : Math.round(v);

      if (param === "bpm") {
        if (this._seq) this._seq.bpm = v;
        if (this._acidFx) this._acidFx.bpm = v;
        if (this._808Fx) this._808Fx.bpm = v;
        if (this._breakFx) this._breakFx.bpm = v;
        if (this._zzfxFx) this._zzfxFx.bpm = v;
        if (this._fmFx) this._fmFx.bpm = v;
      }
      if (param === "volume" && this._acid) this._acid.volume = v;
      if (this._acid) {
        if (param === "cutoff") this._acid.cutoff = v;
        if (param === "resonance") this._acid.resonance = v;
        if (param === "envMod") this._acid.envMod = v;
        if (param === "decay") this._acid.decay = v;
        if (param === "attack") this._acid.attack = v;
        if (param === "distortion") this._acid.distortion = v;
        if (param === "portamento") this._acid.portamento = v;
      }
      if (this._808) {
        if (param === "bass808Decay") this._808.decay = v;
        if (param === "bass808PitchSweep") this._808.pitchSweepSemitones = v;
        if (param === "bass808PitchDecay") this._808.pitchDecay = v;
        if (param === "bass808Distortion") this._808.distortion = v;
        if (param === "bass808Volume") this._808.volume = v;
        if (param === "bass808Click") this._808.click = v;
        if (param === "bass808SubMix") this._808.subOscMix = v;
        if (param === "bass808Tone") this._808.tone = v;
      }
      if (this._break) {
        if (param === "breakRandomChance") this._break.randomChance = v;
        if (param === "breakReverseChance") this._break.reverseChance = v;
        if (param === "breakVolume") this._break.volume = v;
      }
      if (this._zzfx) {
        if (param === "zzfxVolume") this._zzfx.volume = v;
        if (param === "zzfxLpfFreq") this._zzfx.lpfFreq = v;
        if (param === "zzfxHpfFreq") this._zzfx.hpfFreq = v;
        if (param === "zzfxLpfResonance") this._zzfx.lpfResonance = v;
      }
      if (this._fmSynth) {
        if (param === "fmCarrierRatio") this._fmSynth.carrierRatio = v;
        if (param === "fmModRatio") this._fmSynth.modRatio = v;
        if (param === "fmModIndex") this._fmSynth.modIndex = v;
        if (param === "fmModDecay") this._fmSynth.modDecay = v;
        if (param === "fmAttack") this._fmSynth.attack = v;
        if (param === "fmDecay") this._fmSynth.decay = v;
        if (param === "fmSustain") this._fmSynth.sustain = v;
        if (param === "fmRelease") this._fmSynth.release = v;
        if (param === "fmFilterFreq") this._fmSynth.filterFreq = v;
        if (param === "fmFilterQ") this._fmSynth.filterQ = v;
        if (param === "fmDetune") this._fmSynth.detune = v;
        if (param === "fmVolume") this._fmSynth.volume = v;
      }
    });

    wrap.appendChild(lbl);
    wrap.appendChild(slider);
    return wrap;
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
      .instrument-group .acid-controls {
        border: none;
        border-radius: 0;
        margin-bottom: 0;
      }
      .instrument-group .bass808-seq {
        margin-bottom: 0;
        padding: 8px 10px;
        background: #1a1200;
        border-top: 1px solid #2a1a00;
      }

      /* Per-instrument accent colors (used by fx unit via --fx-accent) */
      .break-group  { --fx-accent: #0cc; }
      .bass808-group { --fx-accent: #fa0; }
      .chord-fm-group { --fx-accent: #4af; }
      .zzfx-group   { --fx-accent: #c0f; }
      .acid-group   { --fx-accent: #0f0; }

      /* ---- Transport ---- */
      .acid-transport {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 12px;
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

      /* ---- Control panels ---- */
      .acid-controls {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: 12px 20px;
        background: #1a1a1a;
        padding: 14px;
        border-radius: 6px;
        border: 1px solid #2a2a2a;
      }
      .acid-section-title {
        width: 100%;
        font-size: 0.7em;
        color: #555;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-bottom: -4px;
      }

      /* Break tint */
      .break-controls  { border-color: #002a2a; }
      .break-controls .acid-section-title { color: #005555; }
      .break-controls .acid-ctrl-val { color: #0cc; }
      .break-controls input[type=range] { accent-color: #0cc; }

      /* 808 tint */
      .bass808-controls { border-color: #2a1a00; }
      .bass808-controls .acid-section-title { color: #664400; }
      .bass808-controls .acid-ctrl-val { color: #fa0; }
      .bass808-controls input[type=range] { accent-color: #fa0; }

      /* ZzFX tint */
      .zzfx-controls { border-color: #1e003a; }
      .zzfx-controls .acid-section-title { color: #5a0090; }
      .zzfx-controls .acid-ctrl-val { color: #c0f; }
      .zzfx-controls input[type=range] { accent-color: #c0f; }

      /* FM Chord tint */
      .chord-fm-controls { border-color: #001a2a; }
      .chord-fm-controls .acid-section-title { color: #004466; }
      .chord-fm-controls .acid-ctrl-val { color: #4af; }
      .chord-fm-controls input[type=range] { accent-color: #4af; }

      /* FM chord step sequencer */
      .chord-fm-seq {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 10px 14px;
        background: #0a1520;
        border-top: 1px solid #0f1e30;
      }
      .chord-fm-step {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        padding: 8px 6px;
        background: #0c1a25;
        border: 1px solid #1a2a35;
        border-radius: 5px;
        width: 72px;
        transition: border-color 0.05s, background 0.05s;
      }
      .chord-fm-active-step { border-color: #4af; background: #0a1a2e; }
      .chord-fm-step-on {
        background: none;
        border: none;
        font-size: 1.3em;
        color: #333;
        cursor: pointer;
        padding: 0;
        line-height: 1;
        font-family: monospace;
      }
      .chord-fm-step-on.on { color: #4af; }
      .chord-fm-step-on:hover { color: #39d; }

      /* FM chord jam button */
      .chord-fm-rand-btn {
        background: #001525;
        color: #4af;
        border-color: #4af;
      }
      .chord-fm-rand-btn:hover { background: #4af; color: #000; }

      /* ---- Controls ---- */
      .acid-ctrl {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 110px;
      }
      .acid-ctrl-wide { min-width: 220px; }
      .acid-ctrl label {
        font-size: 0.72em;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .acid-ctrl-val { color: #0f0; }
      .acid-ctrl input[type=range] { accent-color: #0f0; width: 100%; }

      .acid-wave-row {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 0.72em;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .acid-wave-btn {
        font-family: monospace;
        font-size: 0.85em;
        padding: 3px 8px;
        background: #222;
        color: #666;
        border: 1px solid #444;
        cursor: pointer;
        border-radius: 3px;
      }
      .acid-wave-btn.active { background: #0f0; color: #000; border-color: #0f0; }
      .acid-wave-btn:hover:not(.active) { color: #ccc; border-color: #888; }

      .acid-rand-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        background: #141414;
        border-top: 1px solid #1e1e1e;
      }
      .acid-rand-btn {
        font-family: monospace;
        font-size: 0.9em;
        padding: 6px 14px;
        background: #1a1a0a;
        color: #fa0;
        border: 1px solid #fa0;
        border-radius: 4px;
        cursor: pointer;
        white-space: nowrap;
      }
      .acid-rand-btn:hover { background: #fa0; color: #000; }
      .zzfx-rand-btn {
        background: #130020;
        color: #c0f;
        border-color: #c0f;
      }
      .zzfx-rand-btn:hover { background: #c0f; color: #000; }

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

      /* ---- 303 Step sequencer ---- */
      .acid-seq {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 10px 14px;
        background: #141414;
        border-top: 1px solid #1e1e1e;
      }
      .acid-step {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        padding: 8px 6px;
        background: #1a1a1a;
        border: 1px solid #2a2a2a;
        border-radius: 5px;
        width: 72px;
        transition: border-color 0.05s, background 0.05s;
      }
      .acid-step.active-step { border-color: #0f0; background: #0b1a0b; }
      .acid-step-num {
        font-size: 0.65em;
        color: #444;
        line-height: 1;
      }
      .acid-step-on {
        background: none;
        border: none;
        font-size: 1.3em;
        color: #333;
        cursor: pointer;
        padding: 0;
        line-height: 1;
        font-family: monospace;
      }
      .acid-step-on.on { color: #0f0; }
      .acid-step-on:hover { color: #0a0; }
      .acid-step-note {
        width: 100%;
        font-size: 0.7em;
        font-family: monospace;
        background: #222;
        color: #ccc;
        border: 1px solid #333;
        border-radius: 3px;
        padding: 2px;
      }
      .acid-step-accent {
        display: flex;
        align-items: center;
        gap: 3px;
        font-size: 0.65em;
        color: #666;
        cursor: pointer;
        user-select: none;
      }
      .acid-step-accent input { accent-color: #fa0; cursor: pointer; }

      /* ---- 808 Step sequencer ---- */
      .bass808-seq {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .bass808-step {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        padding: 8px 6px;
        background: #1a1200;
        border: 1px solid #2a1a00;
        border-radius: 5px;
        width: 72px;
        transition: border-color 0.05s, background 0.05s;
      }
      .bass808-active-step { border-color: #fa0; background: #2a1800; }
      .bass808-step-on {
        background: none;
        border: none;
        font-size: 1.3em;
        color: #333;
        cursor: pointer;
        padding: 0;
        line-height: 1;
        font-family: monospace;
      }
      .bass808-step-on.on { color: #fa0; }
      .bass808-step-on:hover { color: #c80; }

      /* ---- Break jam buttons ---- */
      .break-jam-ctrl { min-width: unset; }
      .break-jam-btns {
        display: flex;
        gap: 5px;
      }
      .break-jam-btn {
        font-family: monospace;
        font-size: 1em;
        font-weight: bold;
        padding: 5px 10px;
        background: #001a1a;
        color: #0cc;
        border: 1px solid #0cc;
        border-radius: 4px;
        cursor: pointer;
        user-select: none;
      }
      .break-jam-btn:hover { background: #0cc; color: #000; }
      .break-jam-btn:active { background: #0ee; color: #000; }

      /* ---- Waveform displays ---- */
      web-audio-waveform {
        height: 44px;
        background: #060606;
        border-top: 1px solid #151515;
      }
      .break-group  web-audio-waveform { border-color: #002020; }
      .bass808-group web-audio-waveform { border-color: #1a0f00; }
      .chord-fm-group web-audio-waveform { border-color: #001a2a; }
      .zzfx-group   web-audio-waveform { border-color: #100020; }
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
