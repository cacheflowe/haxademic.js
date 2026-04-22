/**
 * WebAudioWaveform — oscilloscope-style waveform display web component.
 *
 * Reads time-domain data from an AnalyserNode and draws a waveform to a canvas
 * at ~60fps via requestAnimationFrame. Resizes responsively via ResizeObserver.
 *
 * Usage:
 *   const waveform = document.createElement("web-audio-waveform");
 *   parentEl.appendChild(waveform);
 *   // After AudioContext is available:
 *   const analyser = ctx.createAnalyser();
 *   someNode.connect(analyser);
 *   waveform.init(analyser, "#0f0");
 */
export default class WebAudioWaveform extends HTMLElement {
  static #cssInjected = false;

  constructor() {
    super();
    this._analyser = null;
    this._data = null;
    this._canvas = null;
    this._ctx2d = null;
    this._raf = null;
    this._color = "#00ff00";
    this._ro = null;
  }

  connectedCallback() {
    WebAudioWaveform._injectCSS();
    this._canvas = document.createElement("canvas");
    this.appendChild(this._canvas);
    this._ro = new ResizeObserver(() => this._onResize());
    this._ro.observe(this);
  }

  disconnectedCallback() {
    this._ro?.disconnect();
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = null;
    }
  }

  _onResize() {
    if (!this._canvas) return;
    this._canvas.width = this.clientWidth;
    this._canvas.height = this.clientHeight;
  }

  /**
   * @param {AnalyserNode} analyserNode
   * @param {string} [color="#00ff00"]
   */
  init(analyserNode, color = "#00ff00") {
    this._analyser = analyserNode;
    this._analyser.fftSize = 512;
    this._data = new Uint8Array(this._analyser.frequencyBinCount);
    this._color = color;
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

  static _injectCSS() {
    if (WebAudioWaveform.#cssInjected) return;
    WebAudioWaveform.#cssInjected = true;
    const s = document.createElement("style");
    s.textContent = `
      web-audio-waveform { display: block; }
      web-audio-waveform canvas { display: block; width: 100%; height: 100%; }
    `;
    document.head.appendChild(s);
  }
}

customElements.define("web-audio-waveform", WebAudioWaveform);
