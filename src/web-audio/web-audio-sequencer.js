/**
 * WebAudioSequencer — lookahead step sequencer for precise Web Audio scheduling.
 *
 * Uses the Chris Wilson technique: a setInterval fires every ~25ms and
 * pre-schedules any steps that fall within the next 100ms lookahead window.
 * This decouples JS timer jitter from audio precision — notes are always
 * scheduled as Web Audio events, never driven by setTimeout directly.
 *
 * BPM and steps are mutable at any time; changes take effect on the next tick.
 *
 * Usage:
 *   const seq = new WebAudioSequencer(ctx, { bpm: 120, steps: 16, subdivision: 16 });
 *   seq.onStep((step, time) => {
 *     // `step` is 0–(steps-1); `time` is the precise AudioContext timestamp
 *     if (kickPattern[step]) kick.trigger(1, time);
 *   });
 *   seq.start();
 *   seq.bpm = 140; // tempo changes take effect immediately
 *   seq.stop();
 */
export default class WebAudioSequencer {
  /**
   * @param {AudioContext} ctx
   * @param {object} [options]
   * @param {number} [options.bpm=120]
   * @param {number} [options.steps=16]       Total steps per loop
   * @param {number} [options.subdivision=16] Steps per beat (16 = 16th notes, 8 = 8th notes)
   */
  constructor(ctx, options = {}) {
    this.ctx = ctx;
    this.bpm = options.bpm ?? 120;
    this.steps = options.steps ?? 16;
    this.subdivision = options.subdivision ?? 16;

    this._callbacks = [];
    this._currentStep = 0;
    this._nextNoteTime = 0;
    this._lookaheadMs = 25; // setInterval period
    this._scheduleAheadSec = 0.1; // how far ahead to schedule
    this._timerId = null;
  }

  /** Duration of one step in seconds (reads live bpm/subdivision). */
  stepDurationSec() {
    return (60 / this.bpm) * (4 / this.subdivision);
  }

  _tick() {
    while (this._nextNoteTime < this.ctx.currentTime + this._scheduleAheadSec) {
      const step = this._currentStep;
      const time = this._nextNoteTime;
      this._callbacks.forEach((cb) => cb(step, time));
      this._nextNoteTime += this.stepDurationSec();
      this._currentStep = (this._currentStep + 1) % this.steps;
    }
  }

  /** Register a step callback. Multiple callbacks are all called each step. */
  onStep(cb) {
    this._callbacks.push(cb);
    return this;
  }

  start() {
    if (this._timerId) this.stop();
    this._currentStep = 0;
    this._nextNoteTime = this.ctx.currentTime + 0.05;
    this._timerId = setInterval(() => this._tick(), this._lookaheadMs);
    return this;
  }

  stop() {
    clearInterval(this._timerId);
    this._timerId = null;
    return this;
  }

  get running() {
    return this._timerId !== null;
  }
}
