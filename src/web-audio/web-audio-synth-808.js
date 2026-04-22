/**
 * WebAudioSynth808 — pitched 808-style sub-bass synthesizer.
 *
 * A sine oscillator sweeps from a starting pitch (target + pitchSweepSemitones)
 * down to the target note over `pitchDecay` seconds, with an exponential
 * amplitude decay. The characteristic 808 "boom" comes from the pitch sweep
 * landing on the fundamental while the sub-bass sustains.
 *
 * Optional soft-clip distortion for the "dirty 808" trap sound.
 * Optional click transient (pre-baked noise burst) for punch and presence.
 * Optional sub oscillator (one octave down) for extra weight.
 * Optional tone lowpass filter for bright/dark shaping.
 *
 * Usage:
 *   const bass = new WebAudioSynth808(ctx, { decay: 1.2, pitchSweepSemitones: 24 });
 *   bass.connect(ctx.destination);
 *   bass.trigger(36, stepDurSec, atTime); // C2
 */
export default class WebAudioSynth808 {
  /**
   * @param {AudioContext} ctx
   * @param {object} [options]
   * @param {number} [options.pitchSweepSemitones=24]  Semitones above target at start of sweep
   * @param {number} [options.pitchDecay=0.1]           Seconds for pitch to reach target note
   * @param {number} [options.decay=0.8]                Amplitude decay in seconds
   * @param {number} [options.distortion=0]             Soft-clip amount 0–1
   * @param {number} [options.click=0.4]                Noise transient click level 0–1
   * @param {number} [options.subOscMix=0]              Sub oscillator (octave below) mix 0–1
   * @param {number} [options.tone=3000]                Tone lowpass cutoff Hz
   * @param {number} [options.volume=1.0]
   */
  constructor(ctx, options = {}) {
    this.ctx = ctx;
    this.pitchSweepSemitones = options.pitchSweepSemitones ?? 24;
    this.pitchDecay = options.pitchDecay ?? 0.1;
    this.decay = options.decay ?? 0.8;
    this.click = options.click ?? 0.4;
    this.subOscMix = options.subOscMix ?? 0;

    this._distortion = options.distortion ?? 0;
    this._distortionCurve = this._makeDistortionCurve(this._distortion);

    // Tone lowpass — shaping before output
    this._filter = ctx.createBiquadFilter();
    this._filter.type = "lowpass";
    this._filter.frequency.value = options.tone ?? 3000;
    this._filter.Q.value = 1;

    this._out = ctx.createGain();
    this._out.gain.value = options.volume ?? 1.0;

    this._filter.connect(this._out);

    // Pre-bake click noise buffer (15ms, linearly enveloped) — reused on every trigger
    const clickSamples = Math.ceil(ctx.sampleRate * 0.015);
    this._clickBuffer = ctx.createBuffer(1, clickSamples, ctx.sampleRate);
    const cd = this._clickBuffer.getChannelData(0);
    for (let i = 0; i < clickSamples; i++) {
      cd[i] = (Math.random() * 2 - 1) * (1 - i / clickSamples);
    }
  }

  // ---- Properties ----

  get distortion() {
    return this._distortion;
  }

  set distortion(v) {
    this._distortion = v;
    this._distortionCurve = this._makeDistortionCurve(v);
  }

  get tone() { return this._filter.frequency.value; }
  set tone(v) { this._filter.frequency.value = v; }

  get volume() {
    return this._out.gain.value;
  }

  set volume(v) {
    this._out.gain.value = v;
  }

  // ---- Routing ----

  get input() {
    return this._out;
  }

  connect(node) {
    this._out.connect(node.input ?? node);
    return this;
  }

  // ---- Helpers ----

  _midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
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

  // ---- Playback ----

  /**
   * Schedule one 808 hit.
   *
   * @param {number} midi        MIDI note number (24–48 typical for 808 bass)
   * @param {number} stepDurSec  Duration of one sequencer step in seconds (unused but kept for API consistency)
   * @param {number} atTime      AudioContext scheduled time
   */
  trigger(midi, stepDurSec, atTime) {
    const ctx = this.ctx;
    const targetFreq = this._midiToFreq(midi);
    const startFreq = targetFreq * Math.pow(2, this.pitchSweepSemitones / 12);

    const osc = ctx.createOscillator();
    const dist = ctx.createWaveShaper();
    const vca = ctx.createGain();

    osc.type = "sine";

    // Pitch sweep: start high, exponentially fall to target
    osc.frequency.setValueAtTime(startFreq, atTime);
    osc.frequency.exponentialRampToValueAtTime(targetFreq, atTime + this.pitchDecay);

    dist.curve = this._distortionCurve;

    // Amplitude: instant peak, exponential decay
    vca.gain.setValueAtTime(1.0, atTime);
    vca.gain.exponentialRampToValueAtTime(0.0001, atTime + this.decay);

    osc.connect(dist);
    dist.connect(vca);
    vca.connect(this._filter);   // → tone filter → _out

    osc.start(atTime);
    osc.stop(atTime + this.decay + 0.05);
    osc.onended = () => { osc.disconnect(); dist.disconnect(); vca.disconnect(); };

    // Click transient — pre-baked noise burst, bypasses tone filter for raw punch
    if (this.click > 0) {
      const clickSrc = ctx.createBufferSource();
      clickSrc.buffer = this._clickBuffer;
      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(this.click, atTime);
      clickSrc.connect(clickGain);
      clickGain.connect(this._out);
      clickSrc.start(atTime);
      clickSrc.onended = () => { clickSrc.disconnect(); clickGain.disconnect(); };
    }

    // Sub oscillator — one octave below, through tone filter
    if (this.subOscMix > 0) {
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = "sine";
      subOsc.frequency.value = targetFreq / 2;
      subGain.gain.setValueAtTime(this.subOscMix, atTime);
      subGain.gain.exponentialRampToValueAtTime(0.0001, atTime + this.decay);
      subOsc.connect(subGain);
      subGain.connect(this._filter);
      subOsc.start(atTime);
      subOsc.stop(atTime + this.decay + 0.05);
      subOsc.onended = () => { subOsc.disconnect(); subGain.disconnect(); };
    }
  }
}
