import DemoBase from './demo--base.es6.js';
import SoundFFT from '../src/sound-fft.es6.js';
import MicrophoneNode from '../src/microphone-node.es6.js';

class MicrophoneNodeDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [], 'MicrophoneNode', 'fft-container');
  }

  init() {
    // setup
    document.body.style.setProperty('background-color', '#ccc');
    this.fftEl = document.getElementById('fft-container');
    this.fftAttached = false;

    // add button to start everything
    this.startButton = document.createElement('button');
    this.startButton.innerText = 'Start';
    this.fftEl.appendChild(this.startButton);

    // click video to add audio response
    this.startButton.addEventListener('click', (e) => {
      this.startButton.parentNode.removeChild(this.startButton);
      this.startMic();
    });
  }

  startMic() {
    // init microphone
    this.soundFFT = null;
    this.mic = new MicrophoneNode(null, () => {
      const fftOptions = {
        fftSize: 512,
        beatAmpDirectionThresh: 0.007,
        beatAmpDirectionSamples: 10,
      };
      this.soundFFT = new SoundFFT(this.mic.getContext(), this.mic.getNode(), fftOptions);
    }, (error) => {
      this.fftEl.innerHTML = '[MicrophoneNode ERROR] :: ' + error + '<br>Are you https:// ?';
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
  }

}

if(window.autoInitDemo) window.demo = new MicrophoneNodeDemo(document.body);
