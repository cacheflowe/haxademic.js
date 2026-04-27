/**
 * WebAudioPitchShift — real-time pitch-shifting audio EFFECT node.
 *
 * Wraps an AudioWorkletNode running a granular pitch-shift processor.
 * This is an effect (processes input audio), not a source — it must be
 * connected between a source node and the destination.
 *
 * Architecture note: this is deliberately an effect rather than a source.
 * BufferSourceNode.start(atTime, offset) provides sample-accurate scheduling
 * that is critical for beat-synced break loops. A worklet-as-source approach
 * (seek/play via postMessage) introduces ~3-6ms jitter per command that
 * accumulates and breaks musical timing. By keeping the worklet as an effect,
 * all transport decisions use the Web Audio scheduler's sample-accurate timing.
 *
 * Signal chain: BufferSourceNode → [WebAudioPitchShift] → GainNode → destination
 *
 * The break player uses this to implement independent pitch and speed control:
 *   - stretchRatio changes BufferSourceNode.playbackRate (affects speed AND pitch)
 *   - This effect compensates: totalShift = userPitch - 12 * log2(stretchRatio)
 *   - Net result: speed changes without pitch change, plus independent pitch control
 *
 * Usage:
 *   const ps = new WebAudioPitchShift(ctx);
 *   await ps.ready;
 *   source.connect(ps.input);
 *   ps.connect(ctx.destination);
 *   ps.pitchShift = -3;  // 3 semitones down
 */

export default class WebAudioPitchShift {
  /**
   * @param {AudioContext} ctx
   */
  constructor(ctx) {
    this.ctx = ctx;
    this._node = null;
    this._ready = false;

    this._initPromise = this._init();
  }

  async _init() {
    const url = new URL("./web-audio-pitch-shift.worklet.js", import.meta.url);
    await this.ctx.audioWorklet.addModule(url);

    this._node = new AudioWorkletNode(this.ctx, "pitch-shift-processor", {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    });

    this._ready = true;
  }

  /** Resolves when the AudioWorklet module is loaded. */
  get ready() {
    return this._initPromise;
  }

  /** The AudioWorkletNode — connect sources to this. */
  get input() {
    return this._node;
  }

  get pitchShift() {
    return this._node?.parameters.get("pitchShift")?.value ?? 0;
  }

  set pitchShift(v) {
    const param = this._node?.parameters.get("pitchShift");
    if (param) param.setValueAtTime(v, this.ctx.currentTime);
  }

  get grainSize() {
    return this._node?.parameters.get("grainSize")?.value ?? 512;
  }

  set grainSize(v) {
    const param = this._node?.parameters.get("grainSize");
    if (param) param.setValueAtTime(v, this.ctx.currentTime);
  }

  connect(node) {
    this._node.connect(node.input ?? node);
    return this;
  }

  disconnect() {
    this._node?.disconnect();
  }
}
