class MicrophoneNodeDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [
      "../src/array-util.es6.js",
      "../src/dom-util.es6.js",
      "../src/float-buffer.es6.js",
      "../src/math-util.es6.js",
      "../src/sound-fft.es6.js",
      "../src/microphone-node.es6.js",
    ], 'MicrophoneNode', 'fft-container');
  }

  init() {
    // setup
    this.fftEl = document.getElementById('fft-container');
    this.fftAttached = false;

    // init microphone
    this.soundFFT = null;
    this.mic = new MicrophoneNode(null, () => {
      this.soundFFT = new SoundFFT(this.mic.getContext(), this.mic.getNode());
    }, (error) => {
      this.fftEl.innerHTML = '[MicrophoneNode ERROR] :: ' + error;
    });

    // kick off sound updates & debug animation
    this.animateFFT();
  }

    // animate fft debug canvas
  animateFFT() {
    requestAnimationFrame(() => {
      this.animateFFT();
      if(this.soundFFT) {
        this.soundFFT.update();
        this.soundFFT.drawDebug();
        this.attachDebugCanvas();
      }
    });
  }

  attachDebugCanvas() {
    if(this.fftAttached) return;
    this.fftAttached = true;
    this.fftEl.appendChild(this.soundFFT.getDebugCanvas());
    this.soundFFT.getDebugCanvas().setAttribute('style', null);
  }

}

if(window.autoInitDemo) new MicrophoneNodeDemo(document.body);
