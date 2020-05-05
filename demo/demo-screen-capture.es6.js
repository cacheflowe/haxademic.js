class ScreenCaptureDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [
      "../src/screen-capture.es6.js",
    ], 'ScreenCapture', 'screen-cap-container');
  }

  init() {
    // setup
    this.screenCapContainer = document.getElementById('screen-cap-container');

    // init ScreenCapture
    this.ScreenCapture = new ScreenCapture((videoEl) => {
      // attach to DOM, fit to container
      videoEl.style.width = '100%';
      this.screenCapContainer.appendChild(videoEl);
    }, (error) => {
      this.screenCapContainer.innerHTML = '[ScreenCapture ERROR] :: ' + error;
    });
  }

}

if(window.autoInitDemo) window.demo = new ScreenCaptureDemo(document.body);
