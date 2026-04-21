/**
 * WebAudioSynthPad — polyphonic pad synth for chord stabs.
 *
 * Accepts an array of MIDI notes per trigger. Each note gets its own
 * oscillator + amp envelope; voices are fire-and-forget.
 *
 * Usage:
 *   const pad = new WebAudioSynthPad(ctx, { attack: 0.5, release: 2 });
 *   pad.connect(reverb);
 *   pad.trigger([48, 51, 55], 1.0, 0.7, time); // C minor triad
 */
export default class WebAudioSynthPad {
  constructor(ctx, options = {}) {
    this.ctx = ctx;
    this.oscType = options.oscType ?? "sine";
    this.attack = options.attack ?? 0.5;
    this.decay = options.decay ?? 0.4;
    this.sustain = options.sustain ?? 0.7;
    this.release = options.release ?? 2.0;

    this._out = ctx.createGain();
    this._out.gain.value = options.volume ?? 1;
  }

  get input() {
    return this._out;
  }

  connect(node) {
    this._out.connect(node.input ?? node);
    return this;
  }

  /**
   * @param {number|number[]} midiNotes  Single MIDI note or chord array
   * @param {number} durationSec
   * @param {number} [velocity]  0–1
   * @param {number} [atTime]    AudioContext time
   */
  trigger(midiNotes, durationSec, velocity = 1, atTime = 0) {
    const ctx = this.ctx;
    const t = atTime > 0 ? atTime : ctx.currentTime;
    const notes = Array.isArray(midiNotes) ? midiNotes : [midiNotes];
    // Constant-power scaling keeps perceived volume stable across chord sizes
    const perVoice = velocity / Math.sqrt(notes.length);

    notes.forEach((midi) => {
      const freq = 440 * Math.pow(2, (midi - 69) / 12);
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();

      osc.type = this.oscType;
      osc.frequency.value = freq;

      amp.gain.setValueAtTime(0, t);
      amp.gain.linearRampToValueAtTime(perVoice, t + this.attack);
      amp.gain.linearRampToValueAtTime(perVoice * this.sustain, t + this.attack + this.decay);
      amp.gain.setValueAtTime(perVoice * this.sustain, t + durationSec);
      amp.gain.linearRampToValueAtTime(0, t + durationSec + this.release);

      osc.connect(amp);
      amp.connect(this._out);

      osc.start(t);
      osc.stop(t + durationSec + this.release + 0.1);
    });

    return this;
  }
}
