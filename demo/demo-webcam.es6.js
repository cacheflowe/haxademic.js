class WebcamDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [
      "../src/webcam.es6.js",
    ], 'Webcam', 'webcam-container');
  }

  init() {
    // setup
    this.webcamContainer = document.getElementById('webcam-container');

    // init microphone
    this.webcam = new Webcam((videoEl) => {
      this.webcamContainer.appendChild(videoEl);
      Webcam.flipH(videoEl);
    }, (error) => {
      this.webcamContainer.innerHTML = '[Webcam ERROR] :: ' + error;
    });

    // kick off sound updates & debug animation
    this.animate();
  }

    // animate fft debug canvas
  animate() {
    requestAnimationFrame(() => {
      this.animate();
    });
  }

}

if(window.autoInitDemo) new WebcamDemo(document.body);
