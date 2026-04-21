import * as Tone from "tone";
import DemoBase from "./demo--base-element.js";

// Scales ordered dark (0.0) → bright (1.0) for mood mapping
const SCALES = [
  ["Phrygian", [0, 1, 3, 5, 7, 8, 10]],
  ["Blues", [0, 3, 5, 6, 7, 10]],
  ["Minor", [0, 2, 3, 5, 7, 8, 10]],
  ["Dorian", [0, 2, 3, 5, 7, 9, 10]],
  ["Pent Minor", [0, 3, 5, 7, 10]],
  ["Pent Major", [0, 2, 4, 7, 9]],
  ["Major", [0, 2, 4, 5, 7, 9, 11]],
  ["Lydian", [0, 2, 4, 6, 7, 9, 11]],
];

// Lead oscillator type follows mood: dark → bright
const LEAD_OSC_TYPES = ["square", "square", "sawtooth", "sawtooth", "triangle", "triangle", "sine", "sine"];

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const ROOT_MIDI = 48; // C3 — bass anchor

// Auto-pilot params: which sliders oscillate and at what speed range (seconds per full cycle)
const AUTO_PARAMS = [
  { param: "mood", minPeriod: 60, maxPeriod: 120 },
  { param: "excitement", minPeriod: 45, maxPeriod: 90 },
  { param: "health", minPeriod: 80, maxPeriod: 160 },
];

function midiToNote(midi) {
  return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

function randBetween(a, b) {
  return a + Math.random() * (b - a);
}

class ToneGenerativeMusic extends DemoBase {
  static meta = {
    title: "Tone.js Generative Music",
    category: "Media",
    description: "Mood, excitement, and health sliders drive real-time synthesized generative music",
  };

  init() {
    this._started = false;
    this._autoPilot = false;
    this._autoRaf = null;
    this._p = {
      mood: 0.5,
      excitement: 0.35,
      health: 0.8,
      volume: 0.75,
    };
    // Per-param auto-pilot state: random phase + period
    this._autoPhase = {};
    this._autoPeriod = {};
    AUTO_PARAMS.forEach(({ param, minPeriod, maxPeriod }) => {
      this._autoPhase[param] = Math.random() * Math.PI * 2;
      this._autoPeriod[param] = randBetween(minPeriod, maxPeriod);
    });

    this._beatLeds = [];
    this._sliderRefs = {}; // param → { range, valEl }
    this._transport = null;
    this._bassSeq = this._leadSeq = this._padSeq = this._kickSeq = this._hihatSeq = null;
    this.buildUI();
    this.addCSS();
  }

  // ---- Music theory ----

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
    return 60 + Math.round(this._p.excitement * 100);
  } // 60–160

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

  // ---- Pattern builders ----

  _makeBassPattern() {
    const ivs = this._scaleIntervals();
    const root = midiToNote(ROOT_MIDI);
    const fifth = midiToNote(ROOT_MIDI + (ivs[4] ?? 7));
    const high = midiToNote(ROOT_MIDI + 12);
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
        notes[i] = midiToNote(prev);
      }
    }

    if (d > 0.75 && Math.random() < 0.6) {
      const fillPool = this._notePool(ROOT_MIDI + 24, 1);
      for (let i = 12; i < 16; i++) {
        if (Math.random() < d * 0.7) notes[i] = midiToNote(fillPool[Math.floor(Math.random() * fillPool.length)]);
      }
    }

    notes[0] = midiToNote(pool[0]);
    return notes;
  }

  _makePadPattern() {
    const ivs = this._scaleIntervals();
    const m = this._p.mood;
    const d = this._p.excitement;

    const chord = [
      midiToNote(ROOT_MIDI + 12),
      midiToNote(ROOT_MIDI + 12 + (ivs[2] ?? 3)),
      midiToNote(ROOT_MIDI + 12 + (ivs[4] ?? 7)),
    ];
    if (m > 0.6 && ivs[6] != null) chord.push(midiToNote(ROOT_MIDI + 12 + ivs[6]));
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

  // ---- Audio graph ----

  async _startAudio() {
    await Tone.start();
    this._transport = Tone.getTransport();

    this._master = new Tone.Volume(-4).toDestination();

    // Master low-pass filter — cutoff slider drives this
    this._masterFilter = new Tone.Filter({ type: "lowpass", frequency: 8000, rolloff: -12 });
    this._masterFilter.connect(this._master);

    // ---- Per-instrument effect chains ----

    // Lead chain: lead → leadDelay → leadReverb → masterFilter
    // Dark mood = more reverb (spacious/ambient); high excitement = more delay
    this._leadReverb = new Tone.Reverb({ decay: 4, wet: 0.5 });
    await this._leadReverb.ready;
    this._leadReverb.connect(this._masterFilter);

    this._leadDelay = new Tone.FeedbackDelay({ delayTime: "8n", feedback: 0.25, wet: 0.15 });
    this._leadDelay.connect(this._leadReverb);

    // Pad chain: pad → padReverb → masterFilter
    // Pads are always lush; dark mood pushes wet higher
    this._padReverb = new Tone.Reverb({ decay: 5, wet: 0.6 });
    await this._padReverb.ready;
    this._padReverb.connect(this._masterFilter);

    // Bass chain: bass → bassDistortion → bassDelay → masterFilter
    // Low health = more grit/distortion; high excitement = punchy delay
    this._bassDelay = new Tone.FeedbackDelay({ delayTime: "8n", feedback: 0.2, wet: 0.1 });
    this._bassDelay.connect(this._masterFilter);

    this._bassDistortion = new Tone.Distortion({ distortion: 0, wet: 0 });
    this._bassDistortion.connect(this._bassDelay);

    // ---- Synths ----

    this._bass = new Tone.MonoSynth({
      oscillator: { type: "sawtooth" },
      filter: { type: "lowpass", frequency: 500, Q: 5 },
      envelope: { attack: 0.02, decay: 0.2, sustain: 0.5, release: 0.4 },
      filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.3, baseFrequency: 200, octaves: 3 },
      volume: -4,
    });
    this._bass.connect(this._bassDistortion);

    this._lead = new Tone.Synth({
      oscillator: { type: LEAD_OSC_TYPES[this._scaleIndex()] },
      envelope: { attack: 0.02, decay: 0.15, sustain: 0.3, release: 0.8 },
      volume: -10,
    });
    this._lead.connect(this._leadDelay);

    this._pad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.5, decay: 0.5, sustain: 0.7, release: 2.0 },
      volume: -16,
    });
    this._pad.connect(this._padReverb);

    // Kick and hihat — dry into master filter
    this._kick = new Tone.MembraneSynth({
      pitchDecay: 0.06,
      octaves: 6,
      envelope: { attack: 0.001, decay: 0.3, sustain: 0.01, release: 0.1 },
      volume: -6,
    });
    this._kick.connect(this._masterFilter);

    this._hihat = new Tone.MetalSynth({
      frequency: 600,
      envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
      volume: -22,
    });
    this._hihat.connect(this._masterFilter);

    this._started = true;
    this._buildSequences();
    this._updateEffects();
    this._transport.start();

    this._regenLoop = new Tone.Loop(() => {
      this._updateSequenceEvents();
      this._updateLeadCharacter();
    }, "1m");
    this._regenLoop.start("+1m");
  }

  _buildSequences() {
    let kickStep = 0;

    this._bassSeq = new Tone.Sequence(
      (time, note) => {
        if (note) this._bass.triggerAttackRelease(note, "8n.", time, 0.4 + this._p.excitement * 0.45);
      },
      this._makeBassPattern(),
      "8n",
    );

    this._leadSeq = new Tone.Sequence(
      (time, note) => {
        if (note) {
          const dur = this._p.excitement > 0.55 ? "16n" : "8n";
          this._lead.triggerAttackRelease(note, dur, time, 0.3 + this._p.excitement * 0.5);
        }
      },
      this._makeLeadPattern(),
      "16n",
    );

    this._padSeq = new Tone.Sequence(
      (time, chord) => {
        if (chord) this._pad.triggerAttackRelease(chord, "4n", time, 0.25 + this._p.mood * 0.25);
      },
      this._makePadPattern(),
      "8n",
    );

    this._kickSeq = new Tone.Sequence(
      (time, hit) => {
        if (hit) this._kick.triggerAttackRelease("C1", "8n", time);
        const s = kickStep % 8;
        Tone.getDraw().schedule(() => this._flashBeat(s), time);
        kickStep++;
      },
      this._makeKickPattern(),
      "8n",
    );

    this._hihatSeq = new Tone.Sequence(
      (time, hit) => {
        if (hit) this._hihat.triggerAttackRelease("32n", time, 0.6 + this._p.excitement * 0.35);
      },
      this._makeHihatPattern(),
      "16n",
    );

    [this._bassSeq, this._leadSeq, this._padSeq, this._kickSeq, this._hihatSeq].forEach((s) => s.start(0));
  }

  _updateSequenceEvents() {
    if (!this._bassSeq) return;
    this._bassSeq.events = this._makeBassPattern();
    this._leadSeq.events = this._makeLeadPattern();
    this._padSeq.events = this._makePadPattern();
    this._kickSeq.events = this._makeKickPattern();
    this._hihatSeq.events = this._makeHihatPattern();
    this._transport.bpm.value = this._bpm();
    this._updateStatus();
  }

  _updateLeadCharacter() {
    if (!this._lead) return;
    try {
      this._lead.set({ oscillator: { type: LEAD_OSC_TYPES[this._scaleIndex()] } });
      this._lead.detune.rampTo((1 - this._p.health) * 25 * (Math.random() < 0.5 ? 1 : -1), 0.1);
      this._lead.portamento = this._p.excitement * 0.06;
    } catch (_) {}
  }

  _updateEffects() {
    if (!this._started) return;
    const { mood, excitement, health } = this._p;

    // Bass: low health = gritty distortion; high excitement = punchy rhythmic delay
    this._bassDistortion.distortion = (1 - health) * 0.9;
    this._bassDistortion.wet.value = Math.max(0, (1 - health) * 0.85);
    this._bassDelay.wet.value = excitement * 0.25;
    this._bassDelay.feedback.value = excitement * 0.35;
    if (this._bass) this._bass.filter.frequency.value = 300 + health * 700;

    // Lead: dark mood = wide, spacious reverb; high excitement = rhythmic echo; low health = washy
    this._leadReverb.wet.value = 0.15 + (1 - mood) * 0.6 + (1 - health) * 0.2;
    this._leadDelay.wet.value = excitement * 0.4;
    this._leadDelay.feedback.value = excitement * 0.4;

    // Pad: dark mood = deep wash; low health = extra smear
    this._padReverb.wet.value = Math.min(0.95, 0.45 + (1 - mood) * 0.45 + (1 - health) * 0.15);

    // Master filter: mood + excitement open the filter (dark+calm = muffled, bright+intense = open)
    const cutoff = mood * 0.55 + excitement * 0.45;
    this._masterFilter.frequency.value = 200 + Math.pow(cutoff, 2) * 14800;

    this._updateStatus();
  }

  _updateStatus() {
    if (!this._statusEl) return;
    this._statusEl.textContent = `${this._scaleName()} · ${this._bpm()} BPM · Health ${Math.round(this._p.health * 100)}%`;
  }

  _flashBeat(step) {
    this._beatLeds.forEach((led, i) => led.classList.toggle("gm-led-on", i === step));
  }

  _toggle() {
    if (!this._started) {
      this._playBtn.textContent = "Loading…";
      this._playBtn.disabled = true;
      this._startAudio().then(() => {
        this._playBtn.textContent = "◼ Stop";
        this._playBtn.disabled = false;
      });
    } else if (this._transport.state === "started") {
      this._transport.stop();
      this._flashBeat(-1);
      this._playBtn.textContent = "▶ Start";
    } else {
      this._transport.start();
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
    const elapsed = (performance.now() - this._autoStart) / 1000; // seconds

    AUTO_PARAMS.forEach(({ param }) => {
      const period = this._autoPeriod[param];
      const phase = this._autoPhase[param];
      const v = (Math.sin((elapsed / period) * Math.PI * 2 + phase) + 1) / 2;
      this._p[param] = v;

      // Sync slider UI
      const ref = this._sliderRefs[param];
      if (ref) {
        ref.range.value = v;
        ref.valEl.textContent = Math.round(v * 100) + "%";
      }
    });

    // Apply all effect + transport changes
    if (this._started) {
      this._transport.bpm.value = this._bpm();
      this._updateEffects();
    }

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
      `<div class="gm-hint">Patterns update every bar · Effects auto-follow mood, excitement &amp; health · Auto oscillates sliders</div>`,
    );
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
        this._master.volume.value = v > 0.001 ? 20 * Math.log10(v) : -Infinity;
      } else if (this._started) {
        this._transport.bpm.value = this._bpm();
        this._updateEffects();
        this._updateSequenceEvents();
        if (param === "mood") this._updateLeadCharacter();
      }
    });

    // Store refs for auto-pilot UI sync (volume excluded from auto)
    if (param !== "volume") {
      this._sliderRefs[param] = { range, valEl: val };
    }

    wrap.appendChild(top);
    wrap.appendChild(range);
    return wrap;
  }

  addCSS() {
    this.injectCSS(/*css*/ `
      tone-generative-music {
        display: block;
        font-family: monospace;
        background: #0c0c14;
        color: #ccc;
        padding: 22px;
        border-radius: 8px;
        max-width: 600px;
      }

      .gm-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 18px;
      }

      .gm-play-btn {
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
      .gm-play-btn:hover:not(:disabled) { background: #9090ff; color: #000; }
      .gm-play-btn:disabled { opacity: 0.5; cursor: default; }

      .gm-auto-btn {
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
      .gm-auto-btn:hover { color: #88aaff; border-color: #446; }
      .gm-auto-btn.gm-auto-active {
        color: #88aaff;
        border-color: #88aaff;
        animation: gm-pulse 2s ease-in-out infinite;
      }
      @keyframes gm-pulse {
        0%, 100% { box-shadow: 0 0 0 0 #88aaff44; }
        50%       { box-shadow: 0 0 0 6px #88aaff00; }
      }

      .gm-status {
        font-size: 0.75em;
        color: #446;
        letter-spacing: 0.06em;
      }

      .gm-led-row {
        display: flex;
        gap: 7px;
        margin-bottom: 20px;
      }
      .gm-led {
        flex: 1;
        height: 10px;
        border-radius: 3px;
        background: #181828;
        transition: background 0.05s, box-shadow 0.05s;
      }
      .gm-led.gm-led-down { background: #1e1e30; }
      .gm-led.gm-led-on   { background: #9090ff; box-shadow: 0 0 10px #9090ff88; }

      .gm-section {
        display: flex;
        flex-direction: column;
        gap: 16px;
        background: #111120;
        border: 1px solid #1e1e32;
        border-radius: 6px;
        padding: 14px 16px;
        margin-bottom: 10px;
      }

      .gm-section-title {
        font-size: 0.65em;
        color: #445;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        margin-bottom: -4px;
      }

      .gm-ctrl { display: flex; flex-direction: column; gap: 6px; }

      .gm-ctrl-top {
        display: flex;
        align-items: baseline;
        gap: 10px;
      }
      .gm-ctrl-label {
        font-size: 0.78em;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        min-width: 80px;
      }
      .gm-ctrl-val {
        font-size: 0.88em;
        font-weight: bold;
        min-width: 38px;
      }
      .gm-ctrl-hint {
        font-size: 0.68em;
        color: #334;
        margin-left: auto;
      }
      .gm-ctrl input[type=range] {
        width: 100%;
        cursor: pointer;
        accent-color: var(--gm-accent, #9090ff);
      }

      .gm-hint {
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
    if (this._started) {
      try {
        this._transport.stop();
        [this._bassSeq, this._leadSeq, this._padSeq, this._kickSeq, this._hihatSeq].forEach((s) => {
          s?.stop();
          s?.dispose();
        });
        this._regenLoop?.stop();
        this._regenLoop?.dispose();
      } catch (_) {}
    }
  }
}

customElements.define("tone-generative-music", ToneGenerativeMusic);
