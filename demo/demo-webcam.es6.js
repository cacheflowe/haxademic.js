import DemoBase from './demo--base.es6.js';
import Webcam from '../src/webcam.es6.js';

class WebcamDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [], 'Webcam', 'webcam-container');
  }

  init() {
    // add button to start everything
    this.startButton = document.createElement('button');
    this.startButton.innerText = 'Start';
    this.el.appendChild(this.startButton);

    // click video to load webcam
    this.startButton.addEventListener('click', (e) => {
      this.startButton.parentNode.removeChild(this.startButton);

      // init webcam
      this.webcam = new Webcam((videoEl) => {
        // attach to DOM and flip to mirror the video
        this.el.appendChild(videoEl);
        Webcam.flipH(videoEl);
      }, (error) => {
        this.el.innerHTML = '[Webcam ERROR] :: ' + error;
      });
    });

  }

}

if(window.autoInitDemo) window.demo = new WebcamDemo(document.body);
