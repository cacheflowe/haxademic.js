import DemoBase from "./demo--base-element.js";
import WebAudioSynthMono from "../src/web-audio/web-audio-synth-mono.js";
import WebAudioSynthPad from "../src/web-audio/web-audio-synth-pad.js";
import WebAudioSynthFM from "../src/web-audio/web-audio-synth-fm.js";
import WebAudioPercKick from "../src/web-audio/web-audio-perc-kick.js";
import WebAudioPercHihat from "../src/web-audio/web-audio-perc-hihat.js";
import WebAudioFxReverb from "../src/web-audio/web-audio-fx-reverb.js";
import WebAudioFxDelay from "../src/web-audio/web-audio-fx-delay.js";
import WebAudioFxUnit from "../src/web-audio/web-audio-fx-unit.js";
import WebAudioWaveform from "../src/web-audio/web-audio-waveform.js";
import WebAudioSequencer from "../src/web-audio/web-audio-sequencer.js";
import { SCALES_ORDERED as SCALES, buildChordFromScale, LEAD_OSC_TYPES } from "../src/web-audio/web-audio-scales.js";

const ROOT_MIDI = 48; // C3

// Auto-pilot — only the three composition sliders oscillate
const AUTO_PARAMS = [
  { param: "mood", minPeriod: 60, maxPeriod: 120 },
  { param: "excitement", minPeriod: 45, maxPeriod: 90 },
  { param: "health", minPeriod: 80, maxPeriod: 160 },
];

function randBetween(a, b) {
  return a + Math.random() * (b - a);
}

// ---------------------------------------------------------------------------
// Demo component
// ---------------------------------------------------------------------------

class WebAudioGenerativeMusic extends DemoBase {
  static meta = {
    title: "Web Audio Generative Music",
    category: "Media",
    description: "Pure Web Audio API generative music demo, custom instruments and sequencer library",
  };

  init() {
    this._started = false;
    this._autoPilot = false;
    this._autoRaf = null;
    this._p = { mood: 0.5, excitement: 0.35, health: 0.8, volume: 0.75 };

    this._autoPhase = {};
    this._autoPeriod = {};
    AUTO_PARAMS.forEach(({ param, minPeriod, maxPeriod }) => {
      this._autoPhase[param] = Math.random() * Math.PI * 2;
      this._autoPeriod[param] = randBetween(minPeriod, maxPeriod);
    });

    this._beatLeds = [];
    this._sliderRefs = {};
    this._fxUnit = null;
    this._waveform = null;

    // Patterns stored as MIDI note numbers (null = rest)
    this._bassPattern = [];
    this._leadPattern = [];
    this._padPattern = [];
    this._kickPattern = [];
    this._hihatPattern = [];
    this._fmChordPattern = []; // array of chord arrays (or null = rest)

    this.buildUI();
    this.addCSS();
  }

  // ---- Music theory helpers ----

  _scaleIndex() {
    return Math.min(SCALES.length - 1, Math.floor(this._p.mood * SCALES.length));
  }
  _scaleName() {
    return SCALES[this._scaleIndex()][0];
  }
  _scaleIntervals() {
    return SCALES[this._scaleIndex()][1];
  }
  _bpm() {
    return 60 + Math.round(this._p.excitement * 70);
  }

  _notePool(rootMidi, octaves) {
    const intervals = this._scaleIntervals();
    const pool = [];
    for (let o = 0; o < octaves; o++) {
      for (const iv of intervals) {
        const m = rootMidi + o * 12 + iv;
        if (m >= 21 && m <= 108) pool.push(m);
      }
    }
    return pool;
  }

  // ---- Pattern builders (return MIDI numbers, not note name strings) ----

  _makeBassPattern() {
    const ivs = this._scaleIntervals();
    const root = ROOT_MIDI;
    const fifth = ROOT_MIDI + (ivs[4] ?? 7);
    const high = ROOT_MIDI + 12;
    const d = this._p.excitement;
    return [
      root,
      d > 0.8 && Math.random() < 0.5 ? root : null,
      d > 0.5 && Math.random() < 0.6 ? fifth : null,
      d > 0.7 && Math.random() < 0.4 ? fifth : null,
      d > 0.2 ? (Math.random() < 0.6 ? fifth : root) : null,
      d > 0.6 && Math.random() < 0.5 ? high : null,
      d > 0.35 && Math.random() < 0.7 ? high : null,
      d > 0.6 && Math.random() < 0.4 ? fifth : null,
    ];
  }

  _makeLeadPattern() {
    const pool = this._notePool(ROOT_MIDI + 12, 2);
    const d = this._p.excitement;
    const h = this._p.health;
    const chromaPool =
      h < 0.4
        ? [...pool, ...pool.map((n) => n + (Math.random() < 0.5 ? 1 : -1))].filter((n) => n >= 21 && n <= 108)
        : pool;
    const weights = [0.95, 0.15, 0.45, 0.25, 0.75, 0.2, 0.55, 0.65, 0.8, 0.2, 0.45, 0.3, 0.65, 0.35, 0.5, 0.4];
    const notes = new Array(16).fill(null);
    let prev = pool[0];
    for (let i = 0; i < 16; i++) {
      if (Math.random() < weights[i] * (0.2 + d * 0.8)) {
        const nearby = chromaPool.filter((n) => Math.abs(n - prev) <= (d > 0.7 ? 7 : 5));
        const src = nearby.length >= 2 ? nearby : chromaPool;
        prev = src[Math.floor(Math.random() * src.length)];
        notes[i] = prev;
      }
    }
    if (d > 0.75 && Math.random() < 0.6) {
      const fillPool = this._notePool(ROOT_MIDI + 24, 1);
      for (let i = 12; i < 16; i++) {
        if (Math.random() < d * 0.7) notes[i] = fillPool[Math.floor(Math.random() * fillPool.length)];
      }
    }
    notes[0] = pool[0];
    return notes;
  }

  _makePadPattern() {
    const ivs = this._scaleIntervals();
    const m = this._p.mood;
    const d = this._p.excitement;
    const chord = [ROOT_MIDI + 12, ROOT_MIDI + 12 + (ivs[2] ?? 3), ROOT_MIDI + 12 + (ivs[4] ?? 7)];
    if (m > 0.6 && ivs[6] != null) chord.push(ROOT_MIDI + 12 + ivs[6]);
    if (m > 0.3 && m < 0.7 && Math.random() < 0.35) chord.push(chord.shift());
    const pat = [chord, null, null, null, chord, null, null, null];
    if (d > 0.6 && Math.random() < 0.5) pat[6] = chord;
    if (d > 0.8 && Math.random() < 0.3) pat[2] = chord;
    return pat;
  }

  _makeKickPattern() {
    const d = this._p.excitement;
    if (d < 0.15) return [1, 0, 0, 0, 0, 0, 0, 0];
    if (d < 0.35) return [1, 0, 0, 0, 1, 0, 0, 0];
    if (d < 0.55) return [1, 0, 1, 0, 1, 0, 0, 0];
    if (d < 0.75) return [1, 0, 1, 0, 1, 0, 1, 0];
    return [1, 0, 1, Math.random() < 0.4 ? 1 : 0, 1, 0, 1, Math.random() < 0.35 ? 1 : 0];
  }

  _makeHihatPattern() {
    const d = this._p.excitement;
    if (d < 0.2) return [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
    if (d < 0.4) return [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0];
    if (d < 0.6) return [0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0];
    if (d < 0.8) return [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];
    return new Array(16).fill(0).map((_, i) => (i % 2 === 0 ? 1 : Math.random() < 0.6 ? 1 : 0));
  }

  _makeFmChordPattern() {
    const d = this._p.excitement;
    const m = this._p.mood;
    // Chord root: 2 octaves above bass root → piano register
    const chordRoot = ROOT_MIDI + 24;
    const chord = buildChordFromScale(chordRoot, this._scaleName(), 3 + (m > 0.6 ? 1 : 0));
    // Sparse 8-step pattern — more hits when excited
    const pat = [chord, null, null, null, chord, null, null, null];
    if (d > 0.5 && Math.random() < 0.4) pat[6] = chord;
    if (d > 0.7 && Math.random() < 0.3) pat[2] = chord;
    return pat;
  }

  _regenPatterns() {
    this._bassPattern = this._makeBassPattern();
    this._leadPattern = this._makeLeadPattern();
    this._padPattern = this._makePadPattern();
    this._kickPattern = this._makeKickPattern();
    this._hihatPattern = this._makeHihatPattern();
    this._fmChordPattern = this._makeFmChordPattern();
    this._seq.bpm = this._bpm();
    if (this._fxUnit) this._fxUnit.bpm = this._bpm();
    this._updateInstrumentCharacter();
    this._updateStatus();
  }

  // ---- Audio graph ----

  _startAudio() {
    this._ctx = new AudioContext();

    // Master out
    this._master = this._ctx.createGain();
    this._master.gain.value = this._p.volume;
    this._master.connect(this._ctx.destination);

    // Master low-pass filter — opened by mood + excitement
    this._masterFilter = this._ctx.createBiquadFilter();
    this._masterFilter.type = "lowpass";
    this._masterFilter.frequency.value = 8000;
    this._masterFilter.connect(this._master);

    // ---- Per-instrument effect chains ----

    // Lead: delay → reverb → masterFilter
    // dark mood = wide reverb; excited = rhythmic echo
    this._leadReverb = new WebAudioFxReverb(this._ctx, { decay: 4, wet: 0.5 });
    this._leadReverb.connect(this._masterFilter);

    this._leadDelay = new WebAudioFxDelay(this._ctx, { delayTime: 0.25, feedback: 0.25, wet: 0.15 });
    this._leadDelay.connect(this._leadReverb);

    // Pad: reverb → masterFilter (always lush; dark = deeper wash)
    this._padReverb = new WebAudioFxReverb(this._ctx, { decay: 5, wet: 0.6 });
    this._padReverb.connect(this._masterFilter);

    // Bass: delay → masterFilter
    this._bassDelay = new WebAudioFxDelay(this._ctx, { delayTime: 0.25, feedback: 0.2, wet: 0.1 });
    this._bassDelay.connect(this._masterFilter);

    // ---- Instruments ----

    this._bass = new WebAudioSynthMono(this._ctx, {
      oscType: "sawtooth",
      filterFreq: 500,
      filterQ: 5,
      filterEnvOctaves: 2,
      attack: 0.02,
      decay: 0.2,
      sustain: 0.5,
      release: 0.4,
      volume: 0.6,
    });
    this._bass.connect(this._bassDelay);

    this._lead = new WebAudioSynthMono(this._ctx, {
      oscType: LEAD_OSC_TYPES[this._scaleIndex()],
      filterFreq: 4000,
      filterQ: 1,
      filterEnvOctaves: 0, // lead uses a stable filter; character comes from osc type
      attack: 0.02,
      decay: 0.15,
      sustain: 0.3,
      release: 0.8,
      volume: 0.35,
    });
    this._lead.connect(this._leadDelay);

    this._pad = new WebAudioSynthPad(this._ctx, {
      attack: 0.5,
      decay: 0.5,
      sustain: 0.7,
      release: 2.0,
      volume: 0.5,
    });
    this._pad.connect(this._padReverb);

    // Kick and hihat go dry into the master filter
    this._kick = new WebAudioPercKick(this._ctx, {
      startFreq: 150,
      endFreq: 40,
      sweepTime: 0.08,
      decay: 0.35,
      volume: 0.9,
    });
    this._kick.connect(this._masterFilter);

    this._hihat = new WebAudioPercHihat(this._ctx, { filterFreq: 8000, filterQ: 0.8, decay: 0.06, volume: 0.4 });
    this._hihat.connect(this._masterFilter);

    // FM chord synth → reverb → masterFilter; mood drives preset choice
    this._fmReverb = new WebAudioFxReverb(this._ctx, { decay: 3, wet: 0.4 });
    this._fmReverb.connect(this._masterFilter);
    this._fm = new WebAudioSynthFM(this._ctx);
    this._fm.applyPreset("E.Piano");
    this._fm.connect(this._fmReverb);

    // WebAudioFxUnit and waveform displays (created in buildUI, initialized here)
    // FxUnit sits between masterFilter and master gain
    if (this._fxUnit) {
      this._fxUnit.init(this._ctx, { title: "Master FX", bpm: this._bpm(), reverbWet: 0, delayMix: 0 });
      this._masterFilter.disconnect();
      this._masterFilter.connect(this._fxUnit.input);
      this._fxUnit.connect(this._master);
    }
    if (this._waveform) {
      const analyser = this._ctx.createAnalyser();
      this._master.connect(analyser);
      this._waveform.init(analyser, "#9090ff");
    }

    // ---- Sequencer ----
    // 16 steps at 16th-note resolution; 8th-note instruments respond every 2 steps.
    this._seq = new WebAudioSequencer(this._ctx, { bpm: this._bpm(), steps: 16, subdivision: 16 });

    this._seq.onStep((step, time) => {
      // New bar: regenerate patterns and sync tempo-locked delay times
      if (step === 0) {
        this._regenPatterns();
        const step8sec = this._seq.stepDurationSec() * 2;
        this._leadDelay.delayTime = step8sec;
        this._bassDelay.delayTime = step8sec;
        // Update FM preset based on mood (darker = Pad/Organ, brighter = Bell/Vibes)
        if (this._fm) {
          const presetNames = Object.keys(WebAudioSynthFM.PRESETS);
          const idx = Math.min(presetNames.length - 1, Math.floor(this._p.mood * presetNames.length));
          this._fm.applyPreset(presetNames[idx]);
        }
      }

      const step16sec = this._seq.stepDurationSec();
      const step8sec = step16sec * 2;

      // Lead (16th notes)
      const leadNote = this._leadPattern[step];
      if (leadNote != null) {
        const dur = this._p.excitement > 0.55 ? step16sec * 0.9 : step8sec * 0.9;
        this._lead.trigger(leadNote, dur, 0.3 + this._p.excitement * 0.5, time);
      }

      // Hihat (16th notes)
      if (this._hihatPattern[step]) {
        this._hihat.trigger(0.6 + this._p.excitement * 0.35, time);
      }

      // 8th-note instruments: kick, bass, pad
      if (step % 2 === 0) {
        const s8 = step >> 1;

        if (this._kickPattern[s8]) {
          this._kick.trigger(0.9, time);
        }

        const bassNote = this._bassPattern[s8];
        if (bassNote != null) {
          this._bass.trigger(bassNote, step8sec * 0.85, 0.4 + this._p.excitement * 0.45, time);
        }

        const chord = this._padPattern[s8];
        if (chord != null) {
          this._pad.trigger(chord, step8sec * 3.5, 0.25 + this._p.mood * 0.25, time);
        }

        // FM chord synth — sparse, higher register sparkle
        const fmChord = this._fmChordPattern[s8];
        if (fmChord != null && this._fm) {
          this._fm.trigger(fmChord, step8sec * 2, time);
        }

        // Visual beat sync — delay the DOM update to match the audio event
        const delayMs = Math.max(0, (time - this._ctx.currentTime) * 1000);
        setTimeout(() => this._flashBeat(s8), delayMs);
      }
    });

    this._started = true;
    this._regenPatterns();
    this._updateEffects();
    this._seq.start();
  }

  // ---- Lead character ----

  // ---- Instrument character ----
  // Called every bar and on slider changes — maps composition state to synth timbre.

  _updateInstrumentCharacter() {
    if (!this._lead || !this._bass) return;
    const { mood, excitement, health } = this._p;

    // Lead: osc type tracks scale (dark=square → bright=sine); low health = detuned thickness
    this._lead.oscType = LEAD_OSC_TYPES[this._scaleIndex()];
    this._lead.detune = (1 - health) * 20 * (Math.random() < 0.5 ? 1 : -1);
    this._lead.detune2 = (1 - health) * 14; // low health = washy chorus
    this._lead.filterFreq = 1200 + mood * 5000 + excitement * 1500;
    this._lead.filterQ = 0.5 + (1 - mood) * 2.5; // dark = more resonant

    // Bass: dark mood = square + sub; bright = sawtooth punch; low health = wobbly
    this._bass.oscType = mood < 0.35 ? "square" : "sawtooth";
    this._bass.subGain = (1 - mood) * 0.45; // dark = thick sub
    this._bass.detune2 = excitement * 6; // excited = slight unison spread
    this._bass.filterFreq = 300 + health * 700;
    this._bass.filterQ = 3 + (1 - health) * 4; // unhealthy = ringing
  }

  // ---- Effects mapping ----
  // All values derived from composition params; no manual effect sliders.

  _updateEffects() {
    if (!this._started) return;
    const { mood, excitement, health } = this._p;

    // Bass delay: excited = punchy echo
    this._bassDelay.wet = excitement * 0.25;
    this._bassDelay.feedback = excitement * 0.35;

    // Lead: dark mood = spacious reverb; excited = rhythmic echo; low health = washy
    this._leadReverb.wet = 0.15 + (1 - mood) * 0.6 + (1 - health) * 0.2;
    this._leadDelay.wet = excitement * 0.4;
    this._leadDelay.feedback = excitement * 0.4;

    // Pad: dark = deep wash; low health = extra smear
    this._padReverb.wet = Math.min(0.95, 0.45 + (1 - mood) * 0.45 + (1 - health) * 0.15);

    // Master filter: mood + excitement open it (dark + calm = muffled)
    const cutoff = mood * 0.55 + excitement * 0.45;
    this._masterFilter.frequency.value = 200 + Math.pow(cutoff, 2) * 14800;

    this._updateInstrumentCharacter();
    this._updateStatus();
  }

  _updateStatus() {
    if (!this._statusEl) return;
    this._statusEl.textContent = `${this._scaleName()} · ${this._bpm()} BPM · Health ${Math.round(this._p.health * 100)}%`;
  }

  _flashBeat(step) {
    this._beatLeds.forEach((led, i) => led.classList.toggle("gm-led-on", i === step));
  }

  // ---- Transport ----

  _toggle() {
    if (!this._started) {
      this._playBtn.textContent = "Loading…";
      this._playBtn.disabled = true;
      this._startAudio();
      this._playBtn.textContent = "◼ Stop";
      this._playBtn.disabled = false;
    } else if (this._seq.running) {
      this._seq.stop();
      this._flashBeat(-1);
      this._playBtn.textContent = "▶ Start";
    } else {
      this._seq.start();
      this._playBtn.textContent = "◼ Stop";
    }
  }

  // ---- Auto-pilot ----

  _toggleAutoPilot() {
    this._autoPilot = !this._autoPilot;
    this._autoBtn.classList.toggle("gm-auto-active", this._autoPilot);
    this._autoBtn.textContent = this._autoPilot ? "◉ Auto" : "○ Auto";
    if (this._autoPilot) {
      this._autoStart = performance.now();
      this._tickAutoPilot();
    } else {
      if (this._autoRaf) cancelAnimationFrame(this._autoRaf);
      this._autoRaf = null;
    }
  }

  _tickAutoPilot() {
    if (!this._autoPilot) return;
    const elapsed = (performance.now() - this._autoStart) / 1000;

    AUTO_PARAMS.forEach(({ param }) => {
      const period = this._autoPeriod[param];
      const phase = this._autoPhase[param];
      const v = (Math.sin((elapsed / period) * Math.PI * 2 + phase) + 1) / 2;
      this._p[param] = v;
      const ref = this._sliderRefs[param];
      if (ref) {
        ref.range.value = v;
        ref.valEl.textContent = Math.round(v * 100) + "%";
      }
    });

    if (this._started) this._updateEffects();

    this._autoRaf = requestAnimationFrame(() => this._tickAutoPilot());
  }

  // ---- UI ----

  buildUI() {
    const header = this.injectHTML(`<div class="gm-header"></div>`);

    this._playBtn = document.createElement("button");
    this._playBtn.className = "gm-play-btn";
    this._playBtn.textContent = "▶ Start";
    this._playBtn.addEventListener("click", () => this._toggle());
    header.appendChild(this._playBtn);

    this._autoBtn = document.createElement("button");
    this._autoBtn.className = "gm-auto-btn";
    this._autoBtn.textContent = "○ Auto";
    this._autoBtn.addEventListener("click", () => this._toggleAutoPilot());
    header.appendChild(this._autoBtn);

    this._statusEl = document.createElement("div");
    this._statusEl.className = "gm-status";
    this._statusEl.textContent = "—";
    header.appendChild(this._statusEl);

    const ledRow = this.injectHTML(`<div class="gm-led-row"></div>`);
    for (let i = 0; i < 8; i++) {
      const led = document.createElement("div");
      led.className = `gm-led${[0, 4].includes(i) ? " gm-led-down" : ""}`;
      ledRow.appendChild(led);
      this._beatLeds.push(led);
    }

    const sec1 = this._makeSection("Composition");
    sec1.appendChild(this._makeSlider("Mood", "mood", 0, 1, 0.01, this._p.mood, "#b070ff", "Dark — Bright"));
    sec1.appendChild(
      this._makeSlider("Excitement", "excitement", 0, 1, 0.01, this._p.excitement, "#ff6040", "Calm — Intense"),
    );
    sec1.appendChild(this._makeSlider("Health", "health", 0, 1, 0.01, this._p.health, "#40d080", "Degraded — Pure"));

    const sec2 = this._makeSection("Sound");
    sec2.appendChild(this._makeSlider("Volume", "volume", 0, 1, 0.01, this._p.volume, "#60c0ff", ""));

    this.injectHTML(
      `<div class="gm-hint">Pure Web Audio · Effects auto-follow composition · Auto oscillates sliders</div>`,
    );

    // FX unit and waveform — audio-initialized lazily in _startAudio()
    this._fxUnit = document.createElement("web-audio-fx-unit");
    this.appendChild(this._fxUnit);
    this._waveform = document.createElement("web-audio-waveform");
    this.appendChild(this._waveform);
  }

  _makeSection(title) {
    const sec = this.injectHTML(`<div class="gm-section"></div>`);
    const t = document.createElement("div");
    t.className = "gm-section-title";
    t.textContent = title;
    sec.appendChild(t);
    return sec;
  }

  _makeSlider(label, param, min, max, step, value, color, hint) {
    const wrap = document.createElement("div");
    wrap.className = "gm-ctrl";

    const top = document.createElement("div");
    top.className = "gm-ctrl-top";

    const lbl = document.createElement("span");
    lbl.className = "gm-ctrl-label";
    lbl.textContent = label;

    const val = document.createElement("span");
    val.className = "gm-ctrl-val";
    val.style.color = color;
    val.textContent = Math.round(value * 100) + "%";

    top.appendChild(lbl);
    top.appendChild(val);
    if (hint) {
      const h = document.createElement("span");
      h.className = "gm-ctrl-hint";
      h.textContent = hint;
      top.appendChild(h);
    }

    const range = document.createElement("input");
    range.type = "range";
    range.min = min;
    range.max = max;
    range.step = step;
    range.value = value;
    range.style.setProperty("--gm-accent", color);
    range.addEventListener("input", () => {
      const v = parseFloat(range.value);
      this._p[param] = v;
      val.textContent = Math.round(v * 100) + "%";

      if (param === "volume" && this._master) {
        this._master.gain.value = v;
      } else if (this._started) {
        this._updateEffects();
        if (param === "mood") this._updateInstrumentCharacter();
      }
    });

    if (param !== "volume") this._sliderRefs[param] = { range, valEl: val };

    wrap.appendChild(top);
    wrap.appendChild(range);
    return wrap;
  }

  addCSS() {
    this.injectCSS(/*css*/ `
      web-audio-generative-music {
        display: block;
        font-family: monospace;
        background: #0c0c14;
        color: #ccc;
        padding: 22px;
        border-radius: 8px;
        max-width: 600px;
      }

      web-audio-generative-music .gm-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 18px;
      }

      web-audio-generative-music .gm-play-btn {
        padding: 9px 22px;
        font-family: monospace;
        font-size: 1em;
        background: #0a0a1e;
        color: #9090ff;
        border: 2px solid #9090ff;
        border-radius: 4px;
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
      }
      web-audio-generative-music .gm-play-btn:hover:not(:disabled) { background: #9090ff; color: #000; }
      web-audio-generative-music .gm-play-btn:disabled { opacity: 0.5; cursor: default; }

      web-audio-generative-music .gm-auto-btn {
        padding: 9px 16px;
        font-family: monospace;
        font-size: 1em;
        background: #0a0a1e;
        color: #446;
        border: 2px solid #223;
        border-radius: 4px;
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
        transition: color 0.2s, border-color 0.2s;
      }
      web-audio-generative-music .gm-auto-btn:hover { color: #88aaff; border-color: #446; }
      web-audio-generative-music .gm-auto-btn.gm-auto-active {
        color: #88aaff;
        border-color: #88aaff;
        animation: gm-pulse 2s ease-in-out infinite;
      }
      @keyframes gm-pulse {
        0%, 100% { box-shadow: 0 0 0 0 #88aaff44; }
        50%       { box-shadow: 0 0 0 6px #88aaff00; }
      }

      web-audio-generative-music .gm-status {
        font-size: 0.75em;
        color: #446;
        letter-spacing: 0.06em;
      }

      web-audio-generative-music .gm-led-row {
        display: flex;
        gap: 7px;
        margin-bottom: 20px;
      }
      web-audio-generative-music .gm-led {
        flex: 1;
        height: 10px;
        border-radius: 3px;
        background: #181828;
        transition: background 0.05s, box-shadow 0.05s;
      }
      web-audio-generative-music .gm-led.gm-led-down { background: #1e1e30; }
      web-audio-generative-music .gm-led.gm-led-on   { background: #9090ff; box-shadow: 0 0 10px #9090ff88; }

      web-audio-generative-music .gm-section {
        display: flex;
        flex-direction: column;
        gap: 16px;
        background: #111120;
        border: 1px solid #1e1e32;
        border-radius: 6px;
        padding: 14px 16px;
        margin-bottom: 10px;
      }

      web-audio-generative-music .gm-section-title {
        font-size: 0.65em;
        color: #445;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        margin-bottom: -4px;
      }

      web-audio-generative-music .gm-ctrl { display: flex; flex-direction: column; gap: 6px; }

      web-audio-generative-music .gm-ctrl-top {
        display: flex;
        align-items: baseline;
        gap: 10px;
      }
      web-audio-generative-music .gm-ctrl-label {
        font-size: 0.78em;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        min-width: 80px;
      }
      web-audio-generative-music .gm-ctrl-val {
        font-size: 0.88em;
        font-weight: bold;
        min-width: 38px;
      }
      web-audio-generative-music .gm-ctrl-hint {
        font-size: 0.68em;
        color: #334;
        margin-left: auto;
      }
      web-audio-generative-music .gm-ctrl input[type=range] {
        width: 100%;
        cursor: pointer;
        accent-color: var(--gm-accent, #9090ff);
      }

      web-audio-generative-music .gm-hint {
        margin-top: 6px;
        font-size: 0.65em;
        color: #2a2a40;
        text-align: center;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
    `);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._autoRaf) cancelAnimationFrame(this._autoRaf);
    if (this._seq) this._seq.stop();
    if (this._ctx) this._ctx.close();
  }
}

customElements.define("web-audio-generative-music", WebAudioGenerativeMusic);
