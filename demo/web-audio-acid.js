import DemoBase from "./demo--base-element.js";
import WebAudioSequencer from "../src/web-audio/web-audio-sequencer.js";
import WebAudioSynthAcid from "../src/web-audio/web-audio-synth-acid.js";
import WebAudioFxReverb from "../src/web-audio/web-audio-fx-reverb.js";
import WebAudioBreakPlayer from "../src/web-audio-break-player.js";

const SCALES = {
  Minor: [0, 2, 3, 5, 7, 8, 10],
  Major: [0, 2, 4, 5, 7, 9, 11],
  "Pent Minor": [0, 3, 5, 7, 10],
  "Pent Major": [0, 2, 4, 7, 9],
  Dorian: [0, 2, 3, 5, 7, 9, 10],
  Phrygian: [0, 1, 3, 5, 7, 8, 10],
  Blues: [0, 3, 5, 6, 7, 10],
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Rhythmic probability per 16th-note step — downbeats and upbeats weighted for acid density
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

// Delay intervals as beat multiples (1 beat = 1 quarter note)
const DELAY_INTERVALS = [
  { label: "1/16", beats: 0.25 },
  { label: "1/8", beats: 0.5 },
  { label: "1/8·", beats: 0.75 },
  { label: "1/4", beats: 1 },
  { label: "1/4·", beats: 1.5 },
  { label: "1/2", beats: 2 },
];

class WebAudioAcid extends DemoBase {
  static meta = {
    title: "Web Audio Acid / TB-303",
    category: "Media",
    description: "TB-303-style acid bass synthesizer with 16-step sequencer and break player",
  };

  init() {
    this._ctx = null;
    this._masterGain = null;
    this._delayNode = null;
    this._delayFeedback = null;
    this._delayWet = null;
    this._acidReverb = null;
    this._acid = null;
    this._break = null;
    this._seq = null;
    this._globalStep = 0;
    this._playing = false;

    this._p = {
      bpm: 128,
      cutoff: 600,
      resonance: 18,
      envMod: 0.6,
      decay: 0.25,
      attack: 0.005,
      distortion: 0,
      portamento: 0,
      reverbWet: 0.15,
      delayInterval: 0.75,
      delayFeedback: 0.35,
      delayMix: 0,
      volume: 0.7,
      waveform: "sawtooth",
      breakSpeedMultiplier: 4,
      breakSubdivision: 8,
      breakReturnSteps: 4,
      breakRandomChance: 0.1,
      breakReverseChance: 0.04,
      breakVolume: 0.8,
    };

    this._steps = this._defaultPattern();
    this._stepEls = [];
    this._stepOnBtns = [];
    this._stepNoteSelects = [];
    this._stepAccentChks = [];
    this._breakFileSelect = null;

    this.buildUI();
    this.addCSS();
  }

  _defaultPattern() {
    const notes = [36, 36, 43, 36, 41, 36, 43, 48, 36, 43, 41, 36, 39, 41, 43, 36];
    const active = new Set([0, 2, 4, 6, 7, 9, 11, 12, 14]);
    const accent = new Set([0, 7, 12]);
    return notes.map((note, i) => ({ active: active.has(i), note, accent: accent.has(i) }));
  }

  // ---- Audio ----

  _initAudio() {
    if (this._ctx) return;
    this._ctx = new AudioContext();

    this._masterGain = this._ctx.createGain();
    this._masterGain.gain.value = 1.0;
    this._masterGain.connect(this._ctx.destination);

    // Delay network — acid feeds reverb (dry path) and delayNode (wet send)
    this._delayNode = this._ctx.createDelay(2.0);
    this._delayFeedback = this._ctx.createGain();
    this._delayWet = this._ctx.createGain();
    this._delayNode.delayTime.value = this._computeDelayTime();
    this._delayFeedback.gain.value = this._p.delayFeedback;
    this._delayWet.gain.value = this._p.delayMix;
    this._delayNode.connect(this._delayFeedback);
    this._delayFeedback.connect(this._delayNode);
    this._delayNode.connect(this._delayWet);
    this._delayWet.connect(this._masterGain);

    // Acid synth → reverb → master (dry path); also → delay (wet send)
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
    this._acidReverb = new WebAudioFxReverb(this._ctx, { wet: this._p.reverbWet });
    this._acid.connect(this._acidReverb);
    this._acidReverb.connect(this._masterGain);
    this._acid.connect(this._delayNode);

    // Break player
    this._break = new WebAudioBreakPlayer(this._ctx, {
      speedMultiplier: this._p.breakSpeedMultiplier,
      subdivision: this._p.breakSubdivision,
      returnSteps: this._p.breakReturnSteps,
      randomChance: this._p.breakRandomChance,
      reverseChance: this._p.breakReverseChance,
      volume: this._p.breakVolume,
    });
    this._break.connect(this._masterGain);
    this._loadBreak();

    // Sequencer
    this._seq = new WebAudioSequencer(this._ctx, {
      bpm: this._p.bpm,
      steps: 16,
      subdivision: 16,
    });
    this._seq.onStep((step, time) => {
      // Acid
      const acidStep = this._steps[step];
      if (acidStep.active) {
        this._acid.trigger(acidStep.note, this._seq.stepDurationSec(), acidStep.accent, time);
      }

      // Break — call every step, player handles loop-boundary logic internally
      if (this._break.loaded) {
        this._break.trigger(this._globalStep, this._p.bpm, time);
      }

      // UI step highlight
      const uiDelay = Math.max(0, (time - this._ctx.currentTime) * 1000);
      setTimeout(() => this._highlightStep(step), uiDelay);

      this._globalStep++;
    });
  }

  _computeDelayTime() {
    return (60 / this._p.bpm) * this._p.delayInterval;
  }

  _loadBreak() {
    if (!this._ctx || !this._break || !this._breakFileSelect) return;
    const file = this._breakFileSelect.value;
    if (file) this._break.load(`../data/audio/breaks/${file}`);
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
    this._highlightStep(-1);
    this._playBtn.textContent = "▶ Play";
  }

  _highlightStep(i) {
    this._stepEls.forEach((el, idx) => el.classList.toggle("active-step", idx === i));
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

    // Bias the pool toward lower notes and the root
    const pool = notes.flatMap((n) => {
      const octaveAbove = Math.floor((n - root) / 12);
      const weight = Math.max(1, 4 - octaveAbove * 2) + (n === root || n === root + 12 ? 2 : 0);
      return Array(weight).fill(n);
    });

    let prevNote = root;
    this._steps = this._steps.map((_, i) => {
      const active = Math.random() < STEP_WEIGHTS[i];
      // Prefer notes within a 7-semitone range of the previous note for melodic flow
      const nearby = pool.filter((n) => Math.abs(n - prevNote) <= 7);
      const src = nearby.length >= 3 ? nearby : pool;
      const note = src[Math.floor(Math.random() * src.length)];
      if (active) prevNote = note;
      const accent = [0, 4, 8, 12].includes(i) && Math.random() < 0.4;
      return { active, note, accent };
    });

    // Step 0 always fires on root
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

    // Synth controls
    const controls = this.injectHTML(`<div class="acid-controls"></div>`);
    controls.appendChild(this._makeSlider("Cutoff", "cutoff", 50, 10000, 1, this._p.cutoff));
    controls.appendChild(this._makeSlider("Resonance", "resonance", 0.1, 30, 0.1, this._p.resonance));
    controls.appendChild(this._makeSlider("Env Mod", "envMod", 0, 1, 0.01, this._p.envMod));
    controls.appendChild(this._makeSlider("Decay", "decay", 0.01, 2, 0.01, this._p.decay));
    controls.appendChild(this._makeSlider("Attack", "attack", 0.001, 0.3, 0.001, this._p.attack));
    controls.appendChild(this._makeSlider("Distortion", "distortion", 0, 1, 0.01, this._p.distortion));
    controls.appendChild(this._makeSlider("Portamento", "portamento", 0, 0.5, 0.001, this._p.portamento));
    controls.appendChild(this._makeSlider("Reverb", "reverbWet", 0, 1, 0.01, this._p.reverbWet));
    controls.appendChild(this._makeSlider("Volume", "volume", 0, 1, 0.01, this._p.volume));

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

    // Delay controls
    const delayRow = this.injectHTML(`<div class="acid-controls"></div>`);
    delayRow.appendChild(
      Object.assign(document.createElement("div"), { className: "acid-section-title", textContent: "Delay" }),
    );

    // Tempo-synced interval select
    const delayIntervalWrap = document.createElement("div");
    delayIntervalWrap.className = "acid-ctrl";
    delayIntervalWrap.appendChild(Object.assign(document.createElement("label"), { textContent: "Interval" }));
    const delayIntervalSelect = document.createElement("select");
    delayIntervalSelect.className = "acid-select";
    DELAY_INTERVALS.forEach(({ label, beats }) => {
      const opt = document.createElement("option");
      opt.value = beats;
      opt.textContent = label;
      if (beats === this._p.delayInterval) opt.selected = true;
      delayIntervalSelect.appendChild(opt);
    });
    delayIntervalSelect.addEventListener("change", () => {
      this._p.delayInterval = parseFloat(delayIntervalSelect.value);
      if (this._delayNode) this._delayNode.delayTime.value = this._computeDelayTime();
    });
    delayIntervalWrap.appendChild(delayIntervalSelect);
    delayRow.appendChild(delayIntervalWrap);

    delayRow.appendChild(this._makeSlider("Feedback", "delayFeedback", 0, 0.9, 0.01, this._p.delayFeedback));
    delayRow.appendChild(this._makeSlider("Mix", "delayMix", 0, 1, 0.01, this._p.delayMix));

    // Break player controls
    const breakRow = this.injectHTML(`<div class="acid-controls"></div>`);
    breakRow.appendChild(
      Object.assign(document.createElement("div"), { className: "acid-section-title", textContent: "Break Player" }),
    );

    // File select
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

    // Speed multiplier select
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

    // Subdivision select — how many on-beat jump slots in the loop
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

    // Return steps select — how many steps before snapping back to nominal
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
    breakRow.appendChild(this._makeSlider("Break Vol", "breakVolume", 0, 1, 0.01, this._p.breakVolume));

    // Randomizer controls
    const randRow = this.injectHTML(`<div class="acid-rand-row"></div>`);

    this._rootSelect = document.createElement("select");
    this._rootSelect.className = "acid-select";
    for (let midi = 24; midi <= 35; midi++) {
      const opt = document.createElement("option");
      opt.value = midi;
      opt.textContent = NOTE_NAMES[midi % 12];
      if (midi === 24) opt.selected = true;
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

    const randBtn = document.createElement("button");
    randBtn.textContent = "⚄ Randomize";
    randBtn.className = "acid-rand-btn";
    randBtn.addEventListener("click", () => this._randomize());

    randRow.appendChild(randBtn);
    randRow.appendChild(this._rootSelect);
    randRow.appendChild(this._scaleSelect);

    // Step sequencer
    const seq = this.injectHTML(`<div class="acid-seq"></div>`);
    const noteOpts = this._noteOptions();

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
  }

  _noteOptions() {
    const opts = [];
    for (let midi = 24; midi <= 60; midi++) {
      opts.push([`${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`, midi]);
    }
    return opts;
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

      // Live-update audio nodes / instruments
      if (param === "bpm") {
        if (this._seq) this._seq.bpm = v;
        if (this._delayNode) this._delayNode.delayTime.value = this._computeDelayTime();
      }
      if (param === "volume" && this._acid) this._acid.volume = v;
      if (param === "reverbWet" && this._acidReverb) this._acidReverb.wet = v;
      if (param === "delayFeedback" && this._delayFeedback) this._delayFeedback.gain.value = v;
      if (param === "delayMix" && this._delayWet) this._delayWet.gain.value = v;
      if (this._acid) {
        if (param === "cutoff") this._acid.cutoff = v;
        if (param === "resonance") this._acid.resonance = v;
        if (param === "envMod") this._acid.envMod = v;
        if (param === "decay") this._acid.decay = v;
        if (param === "attack") this._acid.attack = v;
        if (param === "distortion") this._acid.distortion = v;
        if (param === "portamento") this._acid.portamento = v;
      }
      if (this._break) {
        if (param === "breakRandomChance") this._break.randomChance = v;
        if (param === "breakReverseChance") this._break.reverseChance = v;
        if (param === "breakVolume") this._break.volume = v;
      }
    });

    wrap.appendChild(lbl);
    wrap.appendChild(slider);
    return wrap;
  }

  addCSS() {
    this.injectCSS(`
      web-audio-acid {
        display: block;
        font-family: monospace;
        background: #111;
        color: #ccc;
        padding: 16px;
        border-radius: 6px;
      }

      .acid-transport {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
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

      .acid-controls {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: 12px 20px;
        margin-bottom: 12px;
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

      .acid-ctrl {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 110px;
      }
      .acid-ctrl-wide {
        min-width: 220px;
      }
      .acid-ctrl label {
        font-size: 0.72em;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .acid-ctrl-val { color: #0f0; }
      .acid-ctrl input[type=range] {
        accent-color: #0f0;
        width: 100%;
      }

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
        margin-bottom: 12px;
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

      .acid-select {
        font-family: monospace;
        font-size: 0.85em;
        background: #222;
        color: #ccc;
        border: 1px solid #444;
        border-radius: 3px;
        padding: 5px 6px;
        cursor: pointer;
      }

      .acid-seq {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 4px;
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
      .acid-step.active-step {
        border-color: #0f0;
        background: #0b1a0b;
      }

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
    `);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._stop();
    this._ctx?.close();
  }
}

customElements.define("web-audio-acid", WebAudioAcid);
