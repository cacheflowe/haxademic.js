/**
 * <web-audio-step-seq> — configurable 16-step sequencer UI component.
 *
 * Features:
 *   • On/off toggle per step
 *   • Note select per step (options set via setNoteOptions)
 *   • Optional accent checkbox per step (enable with accent: true in init)
 *   • Active-step highlight (call setActiveStep(i) each tick)
 *   • Dispatches "step-change" CustomEvent when any step is edited
 *
 * Usage:
 *   const seq = document.createElement("web-audio-step-seq");
 *   container.appendChild(seq);
 *   seq.init({
 *     steps: [...],              // array of {active, note, accent?}
 *     noteOptions: [[name, midi], ...],  // initial options for note selects
 *     accent: false,             // show accent checkboxes?
 *     color: "#0f0",             // CSS accent color (used as --seq-color var)
 *     stepClass: "acid-step",    // base CSS class for each step cell
 *   });
 *   seq.setActiveStep(stepIndex);
 *   seq.setNoteOptions([[name, midi], ...]);
 *   seq.steps;                   // returns current [{active, note, accent?}] array
 */
export default class WebAudioStepSeq extends HTMLElement {
  static #cssInjected = false;

  static #injectCSS() {
    if (WebAudioStepSeq.#cssInjected) return;
    WebAudioStepSeq.#cssInjected = true;
    const style = document.createElement("style");
    style.textContent = `
      web-audio-step-seq {
        display: flex;
        flex-wrap: nowrap;
        gap: 4px;
        overflow-x: auto;
      }
      web-audio-step-seq .wass-step {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
        min-width: 42px;
        padding: 4px 2px;
        border-radius: 4px;
        transition: background 0.05s;
      }
      web-audio-step-seq .wass-step.wass-active {
        background: color-mix(in srgb, var(--seq-color, #0f0) 25%, transparent);
      }
      web-audio-step-seq .wass-num {
        font-size: 0.6rem;
        opacity: 0.5;
        line-height: 1;
      }
      web-audio-step-seq .wass-on {
        background: none;
        border: 1px solid color-mix(in srgb, var(--seq-color, #0f0) 50%, transparent);
        color: color-mix(in srgb, var(--seq-color, #0f0) 50%, transparent);
        border-radius: 50%;
        width: 22px;
        height: 22px;
        font-size: 0.7rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
        transition: all 0.1s;
      }
      web-audio-step-seq .wass-on.on {
        background: var(--seq-color, #0f0);
        border-color: var(--seq-color, #0f0);
        color: #111;
      }
      web-audio-step-seq .wass-note {
        font-size: 0.6rem;
        width: 100%;
        background: #222;
        color: #ccc;
        border: 1px solid #444;
        border-radius: 2px;
        padding: 1px 2px;
      }
      web-audio-step-seq .wass-accent {
        display: flex;
        align-items: center;
        gap: 2px;
        font-size: 0.55rem;
        opacity: 0.7;
        cursor: pointer;
        user-select: none;
      }
      web-audio-step-seq .wass-accent input[type=checkbox] {
        margin: 0;
        width: 10px;
        height: 10px;
      }
    `;
    document.head.appendChild(style);
  }

  constructor() {
    super();
    this._steps = [];
    this._stepEls = [];
    this._onBtns = [];
    this._noteSelects = [];
    this._accentChks = [];
    this._hasAccent = false;
    this._stepClass = "wass-step";
    this._initialized = false;
  }

  connectedCallback() {
    WebAudioStepSeq.#injectCSS();
  }

  /**
   * @param {object} options
   * @param {Array<{active: boolean, note: number, accent?: boolean}>} options.steps
   * @param {Array<[string, number]>} [options.noteOptions]  [[name, midi], ...]
   * @param {boolean} [options.accent]   Show accent checkbox column
   * @param {string}  [options.color]    CSS color for the active/highlight state
   * @param {string}  [options.stepClass] Extra class applied to each step cell
   */
  init({ steps, noteOptions = [], accent = false, color, stepClass } = {}) {
    WebAudioStepSeq.#injectCSS();
    this._steps = steps.map((s) => ({
      active: s.active,
      note: s.note,
      ...(accent ? { accent: s.accent ?? false } : {}),
    }));
    this._hasAccent = accent;
    if (color) this.style.setProperty("--seq-color", color);
    if (stepClass) this._stepClass = stepClass;
    this._initialized = true;
    this._render(noteOptions);
  }

  _render(noteOptions) {
    this.innerHTML = "";
    this._stepEls = [];
    this._onBtns = [];
    this._noteSelects = [];
    this._accentChks = [];

    this._steps.forEach((step, i) => {
      const el = document.createElement("div");
      el.className = `wass-step ${this._stepClass}`;

      // Step number
      const num = document.createElement("div");
      num.className = "wass-num";
      num.textContent = i + 1;
      el.appendChild(num);

      // On/off button
      const onBtn = document.createElement("button");
      onBtn.className = `wass-on${step.active ? " on" : ""}`;
      onBtn.textContent = step.active ? "●" : "○";
      onBtn.addEventListener("click", () => {
        this._steps[i].active = !this._steps[i].active;
        onBtn.className = `wass-on${this._steps[i].active ? " on" : ""}`;
        onBtn.textContent = this._steps[i].active ? "●" : "○";
        this._dispatch(i);
      });
      el.appendChild(onBtn);
      this._onBtns.push(onBtn);

      // Note select
      const noteSelect = document.createElement("select");
      noteSelect.className = "wass-note";
      noteOptions.forEach(([name, midi]) => {
        const opt = document.createElement("option");
        opt.value = midi;
        opt.textContent = name;
        if (midi === step.note) opt.selected = true;
        noteSelect.appendChild(opt);
      });
      noteSelect.addEventListener("change", () => {
        this._steps[i].note = parseInt(noteSelect.value);
        this._dispatch(i);
      });
      el.appendChild(noteSelect);
      this._noteSelects.push(noteSelect);

      // Accent checkbox (optional)
      if (this._hasAccent) {
        const accentLabel = document.createElement("label");
        accentLabel.className = "wass-accent";
        accentLabel.title = "Accent — louder with stronger filter sweep";
        const accentChk = document.createElement("input");
        accentChk.type = "checkbox";
        accentChk.checked = step.accent ?? false;
        accentChk.addEventListener("change", () => {
          this._steps[i].accent = accentChk.checked;
          this._dispatch(i);
        });
        accentLabel.appendChild(accentChk);
        accentLabel.appendChild(document.createTextNode("Acc"));
        el.appendChild(accentLabel);
        this._accentChks.push(accentChk);
      }

      this.appendChild(el);
      this._stepEls.push(el);
    });
  }

  _dispatch(stepIndex) {
    this.dispatchEvent(
      new CustomEvent("step-change", {
        bubbles: true,
        detail: { index: stepIndex, step: { ...this._steps[stepIndex] } },
      }),
    );
  }

  // ---- Public API ----

  /** Returns a snapshot copy of all step data. */
  get steps() {
    return this._steps.map((s) => ({ ...s }));
  }

  /** Replace all step data and re-render the UI. */
  set steps(newSteps) {
    if (!this._initialized) return;
    this._steps = newSteps.map((s) => ({
      active: s.active,
      note: s.note,
      ...(this._hasAccent ? { accent: s.accent ?? false } : {}),
    }));
    // Update UI in place without full re-render
    this._steps.forEach((step, i) => {
      const btn = this._onBtns[i];
      if (btn) {
        btn.className = `wass-on${step.active ? " on" : ""}`;
        btn.textContent = step.active ? "●" : "○";
      }
      const sel = this._noteSelects[i];
      if (sel) sel.value = step.note;
      const chk = this._accentChks[i];
      if (chk) chk.checked = step.accent ?? false;
    });
  }

  /**
   * Update note select options (e.g. when root/scale changes).
   * Snaps each step's note to the nearest available MIDI value.
   * @param {Array<[string, number]>} opts  [[name, midi], ...]
   */
  setNoteOptions(opts) {
    const vals = opts.map(([, m]) => m);
    if (!vals.length) return;
    this._noteSelects.forEach((sel, i) => {
      const prev = parseInt(sel.value);
      sel.innerHTML = "";
      opts.forEach(([name, midi]) => {
        const opt = document.createElement("option");
        opt.value = midi;
        opt.textContent = name;
        sel.appendChild(opt);
      });
      const nearest = vals.reduce((a, b) => (Math.abs(b - prev) < Math.abs(a - prev) ? b : a), vals[0]);
      sel.value = nearest;
      this._steps[i].note = nearest;
    });
  }

  /**
   * Highlight the currently playing step; pass -1 to clear all.
   * @param {number} i
   */
  setActiveStep(i) {
    this._stepEls.forEach((el, idx) => el.classList.toggle("wass-active", idx === i));
  }
}

customElements.define("web-audio-step-seq", WebAudioStepSeq);
