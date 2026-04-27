/**
 * WebAudioWaveform — audio visualizer web component.
 *
 * Three display modes, cycled by clicking:
 *   - "waveform"    — oscilloscope-style time-domain display (default)
 *   - "spectrogram" — scrolling frequency waterfall
 *   - "bars"        — FFT EQ bar graph
 *
 * Reads data from an AnalyserNode and draws to a canvas at ~60fps via
 * requestAnimationFrame. Resizes responsively via ResizeObserver.
 *
 * Usage:
 *   const vis = document.createElement("web-audio-waveform");
 *   parentEl.appendChild(vis);
 *   const analyser = ctx.createAnalyser();
 *   someNode.connect(analyser);
 *   vis.init(analyser, "#0f0");                          // default waveform
 *   vis.init(analyser, "#0f0", { mode: "bars" });        // start as EQ bars
 *   vis.mode = "spectrogram";                            // toggle at runtime
 */
export default class WebAudioWaveform extends HTMLElement {
  static #cssInjected = false;

  constructor() {
    super();
    this._analyser = null;
    this._data = null;     // time-domain buffer
    this._freqData = null; // frequency buffer
    this._canvas = null;
    this._ctx2d = null;
    this._raf = null;
    this._color = "#00ff00";
    this._colorRGB = [0, 255, 0]; // parsed RGB for spectrogram pixel fills
    this._ro = null;
    this._mode = "waveform";
  }

  connectedCallback() {
    WebAudioWaveform._injectCSS();
    this._canvas = document.createElement("canvas");
    this.appendChild(this._canvas);
    this._ro = new ResizeObserver(() => this._onResize());
    this._ro.observe(this);
    this.addEventListener("click", this._onClick);
  }

  disconnectedCallback() {
    this._ro?.disconnect();
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = null;
    }
    this.removeEventListener("click", this._onClick);
  }

  _onResize() {
    if (!this._canvas) return;
    this._canvas.width = this.clientWidth;
    this._canvas.height = this.clientHeight;
  }

  static MODES = ["waveform", "spectrogram", "bars"];

  _onClick = () => {
    const modes = WebAudioWaveform.MODES;
    this.mode = modes[(modes.indexOf(this._mode) + 1) % modes.length];
  };

  /** @param {"waveform"|"spectrogram"|"bars"} m */
  set mode(m) {
    if (m === this._mode) return;
    this._mode = m;
    if (this._analyser) {
      this._analyser.fftSize = m === "waveform" ? 512 : 2048;
      this._data = new Uint8Array(this._analyser.frequencyBinCount);
      this._freqData = new Uint8Array(this._analyser.frequencyBinCount);
    }
    // Clear canvas to avoid stale visuals
    if (this._ctx2d && this._canvas) {
      this._ctx2d.clearRect(0, 0, this._canvas.width, this._canvas.height);
    }
  }

  get mode() {
    return this._mode;
  }

  /**
   * @param {AnalyserNode} analyserNode
   * @param {string} [color="#00ff00"]
   * @param {object} [options]
   * @param {"waveform"|"spectrogram"|"bars"} [options.mode="waveform"]
   */
  init(analyserNode, color = "#00ff00", options = {}) {
    this._analyser = analyserNode;
    this._color = color;
    this._colorRGB = WebAudioWaveform._parseColor(color);
    this._mode = options.mode ?? "waveform";
    this._analyser.fftSize = this._mode === "waveform" ? 512 : 2048;
    this._data = new Uint8Array(this._analyser.frequencyBinCount);
    this._freqData = new Uint8Array(this._analyser.frequencyBinCount);
    this._startLoop();
  }

  _startLoop() {
    if (this._raf) return;
    const loop = () => {
      this._raf = requestAnimationFrame(loop);
      this._draw();
    };
    loop();
  }

  _draw() {
    if (this._mode === "spectrogram") this._drawSpectrogram();
    else if (this._mode === "bars") this._drawBars();
    else this._drawWaveform();
  }

  _drawWaveform() {
    if (!this._analyser || !this._canvas) return;
    const w = this._canvas.width;
    const h = this._canvas.height;
    if (w === 0 || h === 0) return;

    this._analyser.getByteTimeDomainData(this._data);

    const ctx = this._ctx2d ?? (this._ctx2d = this._canvas.getContext("2d"));
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    ctx.strokeStyle = this._color;
    ctx.lineWidth = 1.5;

    const len = this._data.length;
    for (let i = 0; i < len; i++) {
      const x = (i / (len - 1)) * w;
      // positive audio = up on screen (oscilloscope convention)
      const y = h * 0.5 - (this._data[i] / 128 - 1) * (h * 0.45);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  _drawSpectrogram() {
    if (!this._analyser || !this._canvas) return;
    const w = this._canvas.width;
    const h = this._canvas.height;
    if (w === 0 || h === 0) return;

    this._analyser.getByteFrequencyData(this._freqData);

    const ctx = this._ctx2d ?? (this._ctx2d = this._canvas.getContext("2d"));

    // Scroll existing content 1px to the left
    const existing = ctx.getImageData(1, 0, w - 1, h);
    ctx.putImageData(existing, 0, 0);

    // Draw new frequency column on the right edge
    const [r, g, b] = this._colorRGB;
    const len = this._freqData.length;
    const col = ctx.createImageData(1, h);
    const pixels = col.data;

    for (let y = 0; y < h; y++) {
      // Map canvas row to frequency bin (bottom = low, top = high)
      const binIndex = Math.floor(((h - 1 - y) / (h - 1)) * (len - 1));
      const intensity = this._freqData[binIndex] / 255;
      const idx = y * 4;
      pixels[idx] = Math.round(r * intensity);
      pixels[idx + 1] = Math.round(g * intensity);
      pixels[idx + 2] = Math.round(b * intensity);
      pixels[idx + 3] = 255;
    }

    ctx.putImageData(col, w - 1, 0);
  }

  _drawBars() {
    if (!this._analyser || !this._canvas) return;
    const w = this._canvas.width;
    const h = this._canvas.height;
    if (w === 0 || h === 0) return;

    this._analyser.getByteFrequencyData(this._freqData);

    const ctx = this._ctx2d ?? (this._ctx2d = this._canvas.getContext("2d"));
    ctx.clearRect(0, 0, w, h);

    // Group frequency bins into bars that fit the canvas width
    const gap = 1;
    const barWidth = Math.max(2, Math.floor(w / 64) - gap);
    const numBars = Math.floor(w / (barWidth + gap));
    const len = this._freqData.length;
    const [r, g, b] = this._colorRGB;

    for (let i = 0; i < numBars; i++) {
      // Map bars to frequency bins (use lower ~75% of spectrum to skip empty high bins)
      const binStart = Math.floor((i / numBars) * len * 0.75);
      const binEnd = Math.floor(((i + 1) / numBars) * len * 0.75);
      let sum = 0;
      const count = Math.max(1, binEnd - binStart);
      for (let j = binStart; j < binEnd; j++) sum += this._freqData[j];
      const intensity = sum / count / 255;

      const barH = intensity * h;
      const x = i * (barWidth + gap);
      // Brighter bars at higher intensity
      const bright = 0.3 + intensity * 0.7;
      ctx.fillStyle = `rgb(${Math.round(r * bright)},${Math.round(g * bright)},${Math.round(b * bright)})`;
      ctx.fillRect(x, h - barH, barWidth, barH);
    }
  }

  /**
   * Parse a CSS hex color string to [r, g, b].
   * @param {string} hex  e.g. "#0f0", "#00ff00", "#9090ff"
   * @returns {number[]}
   */
  static _parseColor(hex) {
    let c = hex.replace("#", "");
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
  }

  static _injectCSS() {
    if (WebAudioWaveform.#cssInjected) return;
    WebAudioWaveform.#cssInjected = true;
    const s = document.createElement("style");
    s.textContent = `
      web-audio-waveform { display: block; cursor: pointer; }
      web-audio-waveform canvas { display: block; width: 100%; height: 100%; }
    `;
    document.head.appendChild(s);
  }
}

customElements.define("web-audio-waveform", WebAudioWaveform);
