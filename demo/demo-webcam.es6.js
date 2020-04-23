class WebcamDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [
      "../src/webcam.es6.js",
    ], 'Webcam', 'webcam-container');
  }

  init() {
    // setup
    this.webcamContainer = document.getElementById('webcam-container');

    // init webcam
    this.webcam = new Webcam((videoEl) => {
      // attach to DOM and flip to mirror the video
      this.webcamContainer.appendChild(videoEl);
      Webcam.flipH(videoEl);
    }, (error) => {
      this.webcamContainer.innerHTML = '[Webcam ERROR] :: ' + error;
    });
  }

}

if(window.autoInitDemo) new WebcamDemo(document.body);
