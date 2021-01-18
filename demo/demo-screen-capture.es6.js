import DemoBase from './demo--base.es6.js';
import ScreenCapture from '../src/screen-capture.es6.js';

class ScreenCaptureDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [], 'ScreenCapture', 'screen-cap-container');
  }

  init() {
    // init ScreenCapture
    this.ScreenCapture = new ScreenCapture((videoEl) => {
      // attach to DOM, fit to container
      videoEl.style.width = '100%';
      this.el.appendChild(videoEl);
    }, (error) => {
      this.el.innerHTML = '[ScreenCapture ERROR] :: ' + error;
    });
  }

}

if(window.autoInitDemo) window.demo = new ScreenCaptureDemo(document.body);
