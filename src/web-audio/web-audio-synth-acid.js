/**
 * WebAudioSynthAcid — TB-303-style monophonic acid bass synthesizer.
 *
 * Fire-and-forget voice architecture: each trigger() call creates a fresh
 * oscillator/filter/VCA chain scheduled precisely at `atTime`. Nodes are
 * self-cleaning via osc.onended.
 *
 * Routing convention:
 *   synth.connect(masterGain);          // dry
 *   synth.connect(delayNode);           // or connect to wet send too
 *
 * Usage:
 *   const acid = new WebAudioSynthAcid(ctx, { cutoff: 800, resonance: 20 });
 *   acid.connect(ctx.destination);
 *   acid.trigger(midi, stepDurSec, accent, atTime);
 *   acid.reset(); // clear portamento tracking (call on stop/restart)
 */
export default class WebAudioSynthAcid {

  static PRESETS = {
    Default: { cutoff: 600,  resonance: 18, envMod: 0.6, decay: 0.25, attack: 0.005, distortion: 0,   portamento: 0,    oscType: "sawtooth", volume: 1.0 },
    Squelch: { cutoff: 400,  resonance: 24, envMod: 0.9, decay: 0.18, attack: 0.003, distortion: 0,   portamento: 0,    oscType: "sawtooth", volume: 0.9 },
    Growl:   { cutoff: 300,  resonance: 16, envMod: 0.7, decay: 0.35, attack: 0.008, distortion: 0.4, portamento: 0,    oscType: "sawtooth", volume: 0.85 },
    Smooth:  { cutoff: 800,  resonance: 8,  envMod: 0.4, decay: 0.40, attack: 0.015, distortion: 0,   portamento: 0.05, oscType: "sawtooth", volume: 1.0 },
    Square:  { cutoff: 500,  resonance: 20, envMod: 0.75,decay: 0.20, attack: 0.004, distortion: 0,   portamento: 0,    oscType: "square",   volume: 0.8 },
  };

  /**
   * @param {AudioContext} ctx
   * @param {object} [options]
   * @param {number} [options.cutoff=600]       Base filter frequency in Hz
   * @param {number} [options.resonance=18]     Filter Q
   * @param {number} [options.envMod=0.6]       Filter envelope depth (0–1)
   * @param {number} [options.decay=0.25]       Filter/amp decay in seconds
   * @param {number} [options.attack=0.005]     Filter/amp attack in seconds
   * @param {number} [options.distortion=0]     Distortion amount (0–1)
   * @param {number} [options.portamento=0]     Glide time in seconds
   * @param {'sawtooth'|'square'} [options.oscType='sawtooth']
   * @param {number} [options.volume=1.0]
   */
  constructor(ctx, options = {}) {
    this.ctx = ctx;
    this.cutoff = options.cutoff ?? 600;
    this.resonance = options.resonance ?? 18;
    this.envMod = options.envMod ?? 0.6;
    this.decay = options.decay ?? 0.25;
    this.attack = options.attack ?? 0.005;
    this.portamento = options.portamento ?? 0;
    this.oscType = options.oscType ?? "sawtooth";

    this._distortion = options.distortion ?? 0;
    this._distortionCurve = this._makeDistortionCurve(this._distortion);
    this._lastScheduledFreq = null;

    this._out = ctx.createGain();
    this._out.gain.value = options.volume ?? 1.0;
  }

  // ---- Properties ----

  get distortion() {
    return this._distortion;
  }

  set distortion(v) {
    this._distortion = v;
    this._distortionCurve = this._makeDistortionCurve(v);
  }

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

  /**
   * Apply a named preset, updating all synth parameters in place.
   * @param {string} name  Key of WebAudioSynthAcid.PRESETS
   */
  applyPreset(name) {
    const p = WebAudioSynthAcid.PRESETS[name];
    if (!p) return;
    if (p.cutoff     != null) this.cutoff     = p.cutoff;
    if (p.resonance  != null) this.resonance  = p.resonance;
    if (p.envMod     != null) this.envMod     = p.envMod;
    if (p.decay      != null) this.decay      = p.decay;
    if (p.attack     != null) this.attack     = p.attack;
    if (p.distortion != null) this.distortion = p.distortion;
    if (p.portamento != null) this.portamento = p.portamento;
    if (p.oscType    != null) this.oscType    = p.oscType;
    if (p.volume     != null) this.volume     = p.volume;
  }

  /** Clear portamento memory — call when stopping/restarting the sequencer. */
  reset() {
    this._lastScheduledFreq = null;
  }

  // ---- Playback ----

  /**
   * Schedule one note.
   *
   * @param {number} midi        MIDI note number (24–60 typical for acid bass)
   * @param {number} stepDurSec  Duration of one sequencer step in seconds
   * @param {boolean} accent     Accent flag — louder with stronger filter sweep
   * @param {number} atTime      AudioContext scheduled time
   */
  trigger(midi, stepDurSec, accent, atTime) {
    const ctx = this.ctx;
    const freq = this._midiToFreq(midi);
    const prevFreq = this._lastScheduledFreq;
    this._lastScheduledFreq = freq;

    const osc = ctx.createOscillator();
    const dist = ctx.createWaveShaper();
    const filter = ctx.createBiquadFilter();
    const vca = ctx.createGain();

    osc.type = this.oscType;

    // Portamento: slide from previous note's frequency
    if (this.portamento > 0 && prevFreq !== null && prevFreq !== freq) {
      osc.frequency.setValueAtTime(prevFreq, atTime);
      osc.frequency.exponentialRampToValueAtTime(freq, atTime + this.portamento);
    } else {
      osc.frequency.setValueAtTime(freq, atTime);
    }

    // Distortion before filter so harmonics get shaped by the cutoff sweep
    dist.curve = this._distortionCurve;

    // Filter envelope
    filter.type = "lowpass";
    filter.Q.value = this.resonance;
    const base = this.cutoff;
    const peak = Math.min(base + base * this.envMod * 4 * (accent ? 1.5 : 1), 18000);
    filter.frequency.setValueAtTime(base, atTime);
    filter.frequency.linearRampToValueAtTime(peak, atTime + this.attack);
    filter.frequency.exponentialRampToValueAtTime(Math.max(base, 30), atTime + this.attack + this.decay);

    // VCA envelope — attack matches filter attack for a unified feel
    const vel = accent ? 1.0 : 0.65;
    const hold = stepDurSec * 0.7;
    const release = 0.05;
    vca.gain.setValueAtTime(0.0001, atTime);
    vca.gain.linearRampToValueAtTime(vel, atTime + this.attack);
    vca.gain.setValueAtTime(vel, atTime + hold);
    vca.gain.exponentialRampToValueAtTime(0.0001, atTime + hold + release);

    // Chain: osc → dist → filter → vca → output
    osc.connect(dist);
    dist.connect(filter);
    filter.connect(vca);
    vca.connect(this._out);

    osc.start(atTime);
    osc.stop(atTime + hold + release + 0.01);
    osc.onended = () => {
      osc.disconnect();
      dist.disconnect();
      filter.disconnect();
      vca.disconnect();
    };
  }
}
