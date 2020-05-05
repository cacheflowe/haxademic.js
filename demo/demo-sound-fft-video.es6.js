class SoundFFTVideoDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [
      "../src/array-util.es6.js",
      "../src/float-buffer.es6.js",
      "../src/frame-loop.es6.js",
      "../src/math-util.es6.js",
      "../src/sound-fft.es6.js",
    ], 'SoundFFT | Video', 'video-fft-container');
  }

  init() {
    // animation loop
    window._frameLoop = new FrameLoop(180, 4);
    _frameLoop.addListener(this);

    // setup
    this.el = document.getElementById('video-fft-container');

    // add video element
    this.videoEl = document.createElement('video');
    this.videoEl.src = '../data/wash-your-hands.mp4';
    this.videoEl.style.setProperty('width', '100%');
    this.videoEl.setAttribute('loop', 'true');
    this.videoEl.volume = 0.3;
    this.el.appendChild(this.videoEl);

    // add button to start everything
    this.startButton = document.createElement('button');
    this.startButton.innerText = 'Start';
    this.el.appendChild(this.startButton);

    // click video to add audio response
    this.startButton.addEventListener('click', (e) => {
      // start video & remove button
      this.videoEl.play();
      this.startButton.parentNode.removeChild(this.startButton);

      // init video & fft
      var audioCtx = new AudioContext();
      var source = audioCtx.createMediaElementSource(this.videoEl);
      this.soundFFT = new SoundFFT(audioCtx, source);
      source.connect(audioCtx.destination);
    });
  }

  frameLoop(frameCount) {
    if(this.soundFFT) {
      this.soundFFT.update();
      this.soundFFT.drawDebug();
      this.updateBg();
      this.attachDebugCanvas();
    }
  }

  updateBg() {
    document.body.style.setProperty('background-color', `rgba(0, ${Math.round(this.soundFFT.getSpectrum()[10] * 255)}, 0, 1)`);
  }

  attachDebugCanvas() {
    if(this.fftAttached) return;
    this.fftAttached = true;
    this.el.appendChild(this.soundFFT.getDebugCanvas());
    this.soundFFT.getDebugCanvas().setAttribute('style', null);
  }


}

if(window.autoInitDemo) window.demo = new SoundFFTVideoDemo(document.body);
