class WebcamDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [
      "../src/webcam.es6.js",
    ], 'Webcam', 'webcam-container');
  }

  init() {
    // setup
    this.webcamContainer = document.getElementById('webcam-container');

    // add button to start everything
    this.startButton = document.createElement('button');
    this.startButton.innerText = 'Start';
    this.webcamContainer.appendChild(this.startButton);

    // click video to add audio response
    this.startButton.addEventListener('click', (e) => {
      this.startButton.parentNode.removeChild(this.startButton);

      // init webcam
      this.webcam = new Webcam((videoEl) => {
        // attach to DOM and flip to mirror the video
        this.webcamContainer.appendChild(videoEl);
        Webcam.flipH(videoEl);
      }, (error) => {
        this.webcamContainer.innerHTML = '[Webcam ERROR] :: ' + error;
      });
    });

  }

}

if(window.autoInitDemo) window.demo = new WebcamDemo(document.body);
