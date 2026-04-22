import DemoBase from "./demo--base-element.js";
import WebAudioSequencer from "../src/web-audio/web-audio-sequencer.js";
import WebAudioSynthAcid from "../src/web-audio/web-audio-synth-acid.js";
import WebAudioSynth808 from "../src/web-audio/web-audio-synth-808.js";
import WebAudioSynthZzfx from "../src/web-audio/web-audio-synth-zzfx.js";
import WebAudioBreakPlayer from "../src/web-audio-break-player.js";
import WebAudioFxUnit from "../src/web-audio/web-audio-fx-unit.js";
import WebAudioWaveform from "../src/web-audio/web-audio-waveform.js";
import WebAudioSynthFM from "../src/web-audio/web-audio-synth-fm.js";

const SCALES = {
  Minor: [0, 2, 3, 5, 7, 8, 10],
  Major: [0, 2, 4, 5, 7, 9, 11],
  "Pent Minor": [0, 3, 5, 7, 10],
  "Pent Major": [0, 2, 4, 7, 9],
  Dorian: [0, 2, 3, 5, 7, 9, 10],
  Phrygian: [0, 1, 3, 5, 7, 8, 10],
  Blues: [0, 3, 5, 6, 7, 10],
};

// DX-7-inspired FM presets — each key maps to the fmXxx param names in _p
const FM_PRESETS = {
  "E.Piano":  { fmCarrierRatio: 1,   fmModRatio: 2,   fmModIndex: 2.5, fmModDecay: 0.20, fmAttack: 0.005, fmDecay: 0.30, fmSustain: 0.15, fmRelease: 0.5,  fmFilterFreq: 8000, fmFilterQ: 1,   fmDetune: 0,  fmVolume: 0.4  },
  "Bell":     { fmCarrierRatio: 1,   fmModRatio: 3.5, fmModIndex: 5,   fmModDecay: 0.06, fmAttack: 0.001, fmDecay: 1.20, fmSustain: 0.0,  fmRelease: 2.5,  fmFilterFreq: 10000,fmFilterQ: 1,   fmDetune: 0,  fmVolume: 0.35 },
  "Vibes":    { fmCarrierRatio: 1,   fmModRatio: 4,   fmModIndex: 1.5, fmModDecay: 0.08, fmAttack: 0.001, fmDecay: 0.30, fmSustain: 0.0,  fmRelease: 0.6,  fmFilterFreq: 6000, fmFilterQ: 1,   fmDetune: 0,  fmVolume: 0.5  },
  "Organ":    { fmCarrierRatio: 1,   fmModRatio: 1,   fmModIndex: 1.5, fmModDecay: 1.00, fmAttack: 0.015, fmDecay: 0.08, fmSustain: 0.9,  fmRelease: 0.06, fmFilterFreq: 5000, fmFilterQ: 1,   fmDetune: 5,  fmVolume: 0.35 },
  "Pad":      { fmCarrierRatio: 1,   fmModRatio: 2,   fmModIndex: 0.8, fmModDecay: 2.00, fmAttack: 0.40,  fmDecay: 0.60, fmSustain: 0.7,  fmRelease: 2.5,  fmFilterFreq: 2500, fmFilterQ: 2,   fmDetune: 8,  fmVolume: 0.3  },
  "Pluck":    { fmCarrierRatio: 1,   fmModRatio: 7,   fmModIndex: 7,   fmModDecay: 0.04, fmAttack: 0.001, fmDecay: 0.12, fmSustain: 0.0,  fmRelease: 0.15, fmFilterFreq: 5000, fmFilterQ: 1,   fmDetune: 0,  fmVolume: 0.55 },
  "Brass":    { fmCarrierRatio: 1,   fmModRatio: 1,   fmModIndex: 3,   fmModDecay: 0.15, fmAttack: 0.08,  fmDecay: 0.20, fmSustain: 0.6,  fmRelease: 0.3,  fmFilterFreq: 4000, fmFilterQ: 2,   fmDetune: 0,  fmVolume: 0.4  },
  "Kalimba":  { fmCarrierRatio: 1,   fmModRatio: 5,   fmModIndex: 2,   fmModDecay: 0.05, fmAttack: 0.001, fmDecay: 0.20, fmSustain: 0.0,  fmRelease: 0.35, fmFilterFreq: 8000, fmFilterQ: 1,   fmDetune: 0,  fmVolume: 0.5  },
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const STEP_WEIGHTS = [0.95, 0.35, 0.65, 0.25, 0.8, 0.3, 0.6, 0.7, 0.85, 0.35, 0.65, 0.25, 0.75, 0.4, 0.65, 0.55];

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

    this._steps = this._defaultPattern();
    this._808Steps = this._default808Pattern();
    this._stepEls = [];
    this._stepOnBtns = [];
    this._stepNoteSelects = [];
    this._stepAccentChks = [];
    this._808StepEls = [];
    this._808OnBtns = [];
    this._808NoteSelects = [];
    this._breakFileSelect = null;
    this._pendingAcidNote = null;
    // FM chord sequencer state
    this._chordSteps = this._defaultChordPattern();
    this._chordStepEls = [];
    this._chordOnBtns = [];
    this._chordNoteSelects = [];
    this._fmSliderInputs = {};
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
      const acidStep = this._steps[step];
      if (acidStep.active) {
        this._acid.trigger(acidStep.note, this._seq.stepDurationSec(), acidStep.accent, time);
      }
      // Manual acid note queued by [B] key / button
      if (this._pendingAcidNote !== null) {
        this._acid.trigger(this._pendingAcidNote, this._seq.stepDurationSec(), false, time);
        this._pendingAcidNote = null;
      }
      // 808
      const bass808Step = this._808Steps[step];
      if (bass808Step.active) {
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
      if (this._chordSteps[step].active) {
        const chord = this._buildChordFromScale(this._chordSteps[step].note, this._scaleSelect.value, this._p.fmChordSize);
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
    this._stepEls.forEach((el, idx) => el.classList.toggle("active-step", idx === i));
    this._808StepEls.forEach((el, idx) => el.classList.toggle("bass808-active-step", idx === i));
    this._chordStepEls.forEach((el, idx) => el.classList.toggle("chord-fm-active-step", idx === i));
  }

  // ---- Randomizer ----

  _buildScaleNotes(rootMidi, scaleName) {
    const intervals = SCALES[scaleName];
    const notes = [];
    for (let oct = 0; oct < 3; oct++) {
      for (const interval of intervals) {
        const midi = rootMidi + oct * 12 + interval;
        if (midi >= 24 && midi <= 60) notes.push(midi);
      }
    }
    return notes;
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
    this._steps = this._steps.map((_, i) => {
      const active = Math.random() < STEP_WEIGHTS[i];
      const nearby = pool.filter((n) => Math.abs(n - prevNote) <= 7);
      const src = nearby.length >= 3 ? nearby : pool;
      const note = src[Math.floor(Math.random() * src.length)];
      if (active) prevNote = note;
      const accent = [0, 4, 8, 12].includes(i) && Math.random() < 0.4;
      return { active, note, accent };
    });
    this._steps[0] = { active: true, note: root, accent: Math.random() < 0.5 };
    this._refreshSeqUI();
  }

  _refreshSeqUI() {
    this._steps.forEach((step, i) => {
      const btn = this._stepOnBtns[i];
      btn.className = `acid-step-on${step.active ? " on" : ""}`;
      btn.textContent = step.active ? "●" : "○";
      this._stepNoteSelects[i].value = step.note;
      this._stepAccentChks[i].checked = step.accent;
    });
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
    const intervals = SCALES[scaleName];
    const chordRoot = rootMidi + 24; // 2 octaves above bass root → piano/chord range
    const chord = [];
    for (let i = 0; i < size; i++) {
      const degreeIdx = (i * 2) % intervals.length;
      const octaveOffset = Math.floor((i * 2) / intervals.length) * 12;
      chord.push(chordRoot + intervals[degreeIdx] + octaveOffset);
    }
    return chord;
  }

  _triggerJamChord() {
    if (!this._fmSynth || !this._ctx) return;
    const root = parseInt(this._rootSelect.value);
    const chord = this._buildChordFromScale(root, this._scaleSelect.value, this._p.fmChordSize);
    this._fmSynth.trigger(chord, this._seq?.stepDurationSec() ?? 0.25, this._ctx.currentTime);
  }

  _applyFmPreset(presetName) {
    const preset = FM_PRESETS[presetName];
    if (!preset) return;
    Object.entries(preset).forEach(([param, val]) => {
      this._p[param] = val;
      const input = this._fmSliderInputs[param];
      if (input) {
        input.value = val;
        const step = parseFloat(input.step);
        const span = input.closest(".acid-ctrl")?.querySelector(".acid-ctrl-val");
        if (span) span.textContent = step < 0.1 ? val.toFixed(3) : step < 1 ? val.toFixed(2) : Math.round(val);
      }
    });
    if (this._fmSynth) {
      const s = this._fmSynth;
      if (preset.fmCarrierRatio != null) s.carrierRatio = preset.fmCarrierRatio;
      if (preset.fmModRatio     != null) s.modRatio     = preset.fmModRatio;
      if (preset.fmModIndex     != null) s.modIndex     = preset.fmModIndex;
      if (preset.fmModDecay     != null) s.modDecay     = preset.fmModDecay;
      if (preset.fmAttack       != null) s.attack       = preset.fmAttack;
      if (preset.fmDecay        != null) s.decay        = preset.fmDecay;
      if (preset.fmSustain      != null) s.sustain      = preset.fmSustain;
      if (preset.fmRelease      != null) s.release      = preset.fmRelease;
      if (preset.fmFilterFreq   != null) s.filterFreq   = preset.fmFilterFreq;
      if (preset.fmFilterQ      != null) s.filterQ      = preset.fmFilterQ;
      if (preset.fmDetune       != null) s.detune       = preset.fmDetune;
      if (preset.fmVolume       != null) s.volume       = preset.fmVolume;
    }
  }

  _refreshChordSeqUI() {
    this._chordSteps.forEach((step, i) => {
      const btn = this._chordOnBtns[i];
      btn.className = `chord-fm-step-on${step.active ? " on" : ""}`;
      btn.textContent = step.active ? "●" : "○";
      if (this._chordNoteSelects[i]) this._chordNoteSelects[i].value = step.note;
    });
  }

  _randomizeFm() {
    // Random preset
    const presetNames = Object.keys(FM_PRESETS);
    const presetName = presetNames[Math.floor(Math.random() * presetNames.length)];
    this._applyFmPreset(presetName);
    if (this._fmPresetSelect) this._fmPresetSelect.value = presetName;

    // Random chord steps: sparse (1–3 active), notes from current scale
    const root = parseInt(this._rootSelect.value);
    const scaleNotes = this._buildScaleNotes(root, this._scaleSelect.value);
    const numActive = 1 + Math.floor(Math.random() * 3);
    const activeSet = new Set([0]); // always keep beat 1
    while (activeSet.size < numActive) activeSet.add(Math.floor(Math.random() * 16));
    this._chordSteps = this._chordSteps.map((_, i) => ({
      active: activeSet.has(i),
      note: scaleNotes[Math.floor(Math.random() * scaleNotes.length)],
    }));
    this._refreshChordSeqUI();
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
    bass808Row.appendChild(this._makeSlider("Decay", "bass808Decay", 0.1, 3, 0.01, this._p.bass808Decay));
    bass808Row.appendChild(this._makeSlider("Pitch Sweep", "bass808PitchSweep", 0, 36, 1, this._p.bass808PitchSweep));
    bass808Row.appendChild(
      this._makeSlider("Pitch Decay", "bass808PitchDecay", 0.01, 1, 0.01, this._p.bass808PitchDecay),
    );
    bass808Row.appendChild(this._makeSlider("Distortion", "bass808Distortion", 0, 1, 0.01, this._p.bass808Distortion));
    bass808Row.appendChild(this._makeSlider("Vol", "bass808Volume", 0, 1, 0.01, this._p.bass808Volume));
    bass808Row.appendChild(this._makeSlider("Click", "bass808Click", 0, 1, 0.01, this._p.bass808Click));
    bass808Row.appendChild(this._makeSlider("Sub Mix", "bass808SubMix", 0, 1, 0.01, this._p.bass808SubMix));
    bass808Row.appendChild(this._makeSlider("Tone", "bass808Tone", 50, 8000, 1, this._p.bass808Tone));

    const seq808 = document.createElement("div");
    seq808.className = "bass808-seq";
    const note808Opts = this._scaleNoteOptions(parseInt(this._rootSelect.value), this._scaleSelect.value, 24, 48);
    this._808Steps.forEach((step, i) => {
      const el = document.createElement("div");
      el.className = "bass808-step";

      const num808 = document.createElement("div");
      num808.className = "acid-step-num";
      num808.textContent = i + 1;
      el.appendChild(num808);

      const onBtn808 = document.createElement("button");
      onBtn808.className = `bass808-step-on${step.active ? " on" : ""}`;
      onBtn808.textContent = step.active ? "●" : "○";
      onBtn808.addEventListener("click", () => {
        this._808Steps[i].active = !this._808Steps[i].active;
        onBtn808.className = `bass808-step-on${this._808Steps[i].active ? " on" : ""}`;
        onBtn808.textContent = this._808Steps[i].active ? "●" : "○";
      });
      el.appendChild(onBtn808);
      this._808OnBtns.push(onBtn808);

      const noteSelect808 = document.createElement("select");
      noteSelect808.className = "acid-step-note";
      note808Opts.forEach(([name, midi]) => {
        const opt = document.createElement("option");
        opt.value = midi;
        opt.textContent = name;
        if (midi === step.note) opt.selected = true;
        noteSelect808.appendChild(opt);
      });
      noteSelect808.addEventListener("change", () => {
        this._808Steps[i].note = parseInt(noteSelect808.value);
      });
      el.appendChild(noteSelect808);
      this._808NoteSelects.push(noteSelect808);

      seq808.appendChild(el);
      this._808StepEls.push(el);
    });

    this._808Fx = document.createElement("web-audio-fx-unit");
    this._808Waveform = document.createElement("web-audio-waveform");
    g808.appendChild(bass808Row);
    g808.appendChild(seq808);
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
    const seqFm = document.createElement("div");
    seqFm.className = "chord-fm-seq";
    const chordNoteOpts = this._scaleNoteOptions(parseInt(this._rootSelect.value), this._scaleSelect.value, 24, 48);
    this._chordSteps.forEach((step, i) => {
      const el = document.createElement("div");
      el.className = "chord-fm-step";

      const num = document.createElement("div");
      num.className = "acid-step-num";
      num.textContent = i + 1;
      el.appendChild(num);

      const onBtn = document.createElement("button");
      onBtn.className = `chord-fm-step-on${step.active ? " on" : ""}`;
      onBtn.textContent = step.active ? "●" : "○";
      onBtn.addEventListener("click", () => {
        this._chordSteps[i].active = !this._chordSteps[i].active;
        onBtn.className = `chord-fm-step-on${this._chordSteps[i].active ? " on" : ""}`;
        onBtn.textContent = this._chordSteps[i].active ? "●" : "○";
      });
      el.appendChild(onBtn);
      this._chordOnBtns.push(onBtn);

      const noteSelect = document.createElement("select");
      noteSelect.className = "acid-step-note";
      chordNoteOpts.forEach(([name, midi]) => {
        const opt = document.createElement("option");
        opt.value = midi;
        opt.textContent = name;
        if (midi === step.note) opt.selected = true;
        noteSelect.appendChild(opt);
      });
      noteSelect.addEventListener("change", () => {
        this._chordSteps[i].note = parseInt(noteSelect.value);
      });
      el.appendChild(noteSelect);
      this._chordNoteSelects.push(noteSelect);

      seqFm.appendChild(el);
      this._chordStepEls.push(el);
    });

    const fmJamRow = document.createElement("div");
    fmJamRow.className = "acid-rand-row";

    // Preset select
    const presetNames = Object.keys(FM_PRESETS);
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
    fmGroup.appendChild(seqFm);
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

    controls.appendChild(this._makeSlider("Cutoff", "cutoff", 50, 10000, 1, this._p.cutoff));
    controls.appendChild(this._makeSlider("Resonance", "resonance", 0.1, 30, 0.1, this._p.resonance));
    controls.appendChild(this._makeSlider("Env Mod", "envMod", 0, 1, 0.01, this._p.envMod));
    controls.appendChild(this._makeSlider("Decay", "decay", 0.01, 2, 0.01, this._p.decay));
    controls.appendChild(this._makeSlider("Attack", "attack", 0.001, 0.3, 0.001, this._p.attack));
    controls.appendChild(this._makeSlider("Distortion", "distortion", 0, 1, 0.01, this._p.distortion));
    controls.appendChild(this._makeSlider("Portamento", "portamento", 0, 0.5, 0.001, this._p.portamento));
    controls.appendChild(this._makeSlider("Vol", "volume", 0, 1, 0.01, this._p.volume));

    this._acidFx = document.createElement("web-audio-fx-unit");

    // Randomizer
    const randRow = document.createElement("div");
    randRow.className = "acid-rand-row";
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
    const seq = document.createElement("div");
    seq.className = "acid-seq";
    const noteOpts = this._scaleNoteOptions(parseInt(this._rootSelect.value), this._scaleSelect.value, 24, 60);
    this._steps.forEach((step, i) => {
      const el = document.createElement("div");
      el.className = "acid-step";

      const num = document.createElement("div");
      num.className = "acid-step-num";
      num.textContent = i + 1;
      el.appendChild(num);

      const onBtn = document.createElement("button");
      onBtn.className = `acid-step-on${step.active ? " on" : ""}`;
      onBtn.textContent = step.active ? "●" : "○";
      onBtn.addEventListener("click", () => {
        this._steps[i].active = !this._steps[i].active;
        onBtn.className = `acid-step-on${this._steps[i].active ? " on" : ""}`;
        onBtn.textContent = this._steps[i].active ? "●" : "○";
      });
      el.appendChild(onBtn);
      this._stepOnBtns.push(onBtn);

      const noteSelect = document.createElement("select");
      noteSelect.className = "acid-step-note";
      noteOpts.forEach(([name, midi]) => {
        const opt = document.createElement("option");
        opt.value = midi;
        opt.textContent = name;
        if (midi === step.note) opt.selected = true;
        noteSelect.appendChild(opt);
      });
      noteSelect.addEventListener("change", () => {
        this._steps[i].note = parseInt(noteSelect.value);
      });
      el.appendChild(noteSelect);
      this._stepNoteSelects.push(noteSelect);

      const accentLabel = document.createElement("label");
      accentLabel.className = "acid-step-accent";
      accentLabel.title = "Accent — louder with stronger filter sweep";
      const accentChk = document.createElement("input");
      accentChk.type = "checkbox";
      accentChk.checked = step.accent;
      accentChk.addEventListener("change", () => {
        this._steps[i].accent = accentChk.checked;
      });
      accentLabel.appendChild(accentChk);
      accentLabel.appendChild(document.createTextNode("Acc"));
      el.appendChild(accentLabel);
      this._stepAccentChks.push(accentChk);

      seq.appendChild(el);
      this._stepEls.push(el);
    });

    this._acidWaveform = document.createElement("web-audio-waveform");
    acidGroup.appendChild(controls);
    acidGroup.appendChild(this._acidFx);
    acidGroup.appendChild(randRow);
    acidGroup.appendChild(seq);
    acidGroup.appendChild(this._acidWaveform);
  }

  _noteOptions() {
    const opts = [];
    for (let midi = 24; midi <= 60; midi++) {
      opts.push([`${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`, midi]);
    }
    return opts;
  }

  _bass808NoteOptions() {
    const opts = [];
    for (let midi = 24; midi <= 48; midi++) {
      opts.push([`${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`, midi]);
    }
    return opts;
  }

  _scaleNoteOptions(rootMidi, scaleName, minMidi, maxMidi) {
    const intervals = new Set(SCALES[scaleName]);
    const opts = [];
    for (let midi = minMidi; midi <= maxMidi; midi++) {
      if (intervals.has(((midi - rootMidi) % 12 + 12) % 12)) {
        opts.push([`${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`, midi]);
      }
    }
    return opts;
  }

  _updateAllNoteSelects() {
    const root = parseInt(this._rootSelect.value);
    const scale = this._scaleSelect.value;
    const acidOpts  = this._scaleNoteOptions(root, scale, 24, 60);
    const bassOpts  = this._scaleNoteOptions(root, scale, 24, 48);
    const chordOpts = this._scaleNoteOptions(root, scale, 24, 48);

    const repopulate = (select, opts, stepArr, idx) => {
      const prev = parseInt(select.value);
      select.innerHTML = "";
      opts.forEach(([name, midi]) => {
        const opt = document.createElement("option");
        opt.value = midi;
        opt.textContent = name;
        select.appendChild(opt);
      });
      // Snap to nearest available note
      const vals = opts.map(([, m]) => m);
      const nearest = vals.reduce((a, b) => (Math.abs(b - prev) < Math.abs(a - prev) ? b : a), vals[0]);
      select.value = nearest;
      if (stepArr) stepArr[idx].note = nearest;
    };

    this._stepNoteSelects.forEach((sel, i) => repopulate(sel, acidOpts,  this._steps,       i));
    this._808NoteSelects.forEach( (sel, i) => repopulate(sel, bassOpts,  this._808Steps,    i));
    this._chordNoteSelects.forEach((sel, i) => repopulate(sel, chordOpts, this._chordSteps, i));
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
