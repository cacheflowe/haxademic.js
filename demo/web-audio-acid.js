import DemoBase from "./demo--base-element.js";

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

class WebAudioAcid extends DemoBase {
  static meta = {
    title: "Web Audio Acid / TB-303",
    category: "Media",
    description: "TB-303-style acid bass synthesizer with 16-step sequencer",
  };

  init() {
    this._ctx = null;
    this._masterGain = null;
    this._delayNode = null;
    this._delayFeedback = null;
    this._delayWet = null;
    this._distortionCurve = this._makeDistortionCurve(0);

    this._p = {
      bpm: 128,
      cutoff: 600,
      resonance: 18,
      envMod: 0.6,
      decay: 0.25,
      attack: 0.005,
      distortion: 0,
      portamento: 0,
      delayTime: 0.375,
      delayFeedback: 0.35,
      delayMix: 0,
      volume: 0.7,
      waveform: "sawtooth",
    };

    this._steps = this._defaultPattern();
    this._playing = false;
    this._schedulerStep = 0;
    this._nextNoteTime = 0;
    this._schedulerTimer = null;
    this._lastScheduledFreq = null;

    this._stepEls = [];
    this._stepOnBtns = [];
    this._stepNoteSelects = [];
    this._stepAccentChks = [];

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
    this._masterGain.gain.value = this._p.volume;
    this._masterGain.connect(this._ctx.destination);

    // Delay network — vca feeds both masterGain (dry) and delayNode (wet)
    this._delayNode = this._ctx.createDelay(2.0);
    this._delayFeedback = this._ctx.createGain();
    this._delayWet = this._ctx.createGain();
    this._delayNode.delayTime.value = this._p.delayTime;
    this._delayFeedback.gain.value = this._p.delayFeedback;
    this._delayWet.gain.value = this._p.delayMix;
    this._delayNode.connect(this._delayFeedback);
    this._delayFeedback.connect(this._delayNode);
    this._delayNode.connect(this._delayWet);
    this._delayWet.connect(this._masterGain);
  }

  _makeDistortionCurve(amount) {
    const n = 512;
    const curve = new Float32Array(n);
    const k = amount * 200;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = k > 0 ? ((Math.PI + k) * x) / (Math.PI + k * Math.abs(x)) : x;
    }
    return curve;
  }

  _updateDistortionCurve() {
    this._distortionCurve = this._makeDistortionCurve(this._p.distortion);
  }

  _midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  _triggerNote(midi, time, accent, stepDur) {
    const ctx = this._ctx;
    const freq = this._midiToFreq(midi);
    const prevFreq = this._lastScheduledFreq;
    this._lastScheduledFreq = freq;

    const osc = ctx.createOscillator();
    const dist = ctx.createWaveShaper();
    const filter = ctx.createBiquadFilter();
    const vca = ctx.createGain();

    osc.type = this._p.waveform;

    // Portamento: slide from previous note's frequency
    if (this._p.portamento > 0 && prevFreq !== null && prevFreq !== freq) {
      osc.frequency.setValueAtTime(prevFreq, time);
      osc.frequency.exponentialRampToValueAtTime(freq, time + this._p.portamento);
    } else {
      osc.frequency.setValueAtTime(freq, time);
    }

    // Distortion before filter so harmonics get shaped by the cutoff sweep
    dist.curve = this._distortionCurve;

    // Filter envelope
    filter.type = "lowpass";
    filter.Q.value = this._p.resonance;
    const base = this._p.cutoff;
    const peak = Math.min(base + base * this._p.envMod * 4 * (accent ? 1.5 : 1), 18000);
    filter.frequency.setValueAtTime(base, time);
    filter.frequency.linearRampToValueAtTime(peak, time + this._p.attack);
    filter.frequency.exponentialRampToValueAtTime(Math.max(base, 30), time + this._p.attack + this._p.decay);

    // VCA envelope — attack matches filter attack so they feel unified
    const vel = accent ? 1.0 : 0.65;
    const hold = stepDur * 0.7;
    const release = 0.05;
    vca.gain.setValueAtTime(0.0001, time);
    vca.gain.linearRampToValueAtTime(vel, time + this._p.attack);
    vca.gain.setValueAtTime(vel, time + hold);
    vca.gain.exponentialRampToValueAtTime(0.0001, time + hold + release);

    // Chain: osc → dist → filter → vca → dry + wet
    osc.connect(dist);
    dist.connect(filter);
    filter.connect(vca);
    vca.connect(this._masterGain);
    vca.connect(this._delayNode);

    osc.start(time);
    osc.stop(time + hold + release + 0.01);
    osc.onended = () => {
      osc.disconnect();
      dist.disconnect();
      filter.disconnect();
      vca.disconnect();
    };
  }

  _stepDuration() {
    return 60 / this._p.bpm / 4;
  }

  _scheduler() {
    if (!this._playing) return;
    const lookahead = 0.1;
    while (this._nextNoteTime < this._ctx.currentTime + lookahead) {
      const step = this._steps[this._schedulerStep];
      if (step.active) this._triggerNote(step.note, this._nextNoteTime, step.accent, this._stepDuration());

      const uiDelay = Math.max(0, (this._nextNoteTime - this._ctx.currentTime) * 1000);
      const s = this._schedulerStep;
      setTimeout(() => this._highlightStep(s), uiDelay);

      this._nextNoteTime += this._stepDuration();
      this._schedulerStep = (this._schedulerStep + 1) % 16;
    }
    this._schedulerTimer = setTimeout(() => this._scheduler(), 25);
  }

  _play() {
    this._initAudio();
    if (this._ctx.state === "suspended") this._ctx.resume();
    this._playing = true;
    this._schedulerStep = 0;
    this._lastScheduledFreq = null;
    this._nextNoteTime = this._ctx.currentTime + 0.05;
    this._scheduler();
    this._playBtn.textContent = "◼ Stop";
  }

  _stop() {
    this._playing = false;
    clearTimeout(this._schedulerTimer);
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
    delayRow.appendChild(this._makeSlider("Time", "delayTime", 0.01, 1, 0.001, this._p.delayTime));
    delayRow.appendChild(this._makeSlider("Feedback", "delayFeedback", 0, 0.9, 0.01, this._p.delayFeedback));
    delayRow.appendChild(this._makeSlider("Mix", "delayMix", 0, 1, 0.01, this._p.delayMix));

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
        step.active = !step.active;
        onBtn.className = `acid-step-on${step.active ? " on" : ""}`;
        onBtn.textContent = step.active ? "●" : "○";
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
        step.note = parseInt(noteSelect.value);
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
        step.accent = accentChk.checked;
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
      if (param === "volume" && this._masterGain) this._masterGain.gain.value = v;
      if (param === "distortion") this._updateDistortionCurve();
      if (param === "delayTime" && this._delayNode) this._delayNode.delayTime.value = v;
      if (param === "delayFeedback" && this._delayFeedback) this._delayFeedback.gain.value = v;
      if (param === "delayMix" && this._delayWet) this._delayWet.gain.value = v;
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
