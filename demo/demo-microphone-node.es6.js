import DemoBase from "./demo--base.es6.js";
import SoundFFT from "../src/sound-fft.es6.js";
import MicrophoneNode from "../src/microphone-node.es6.js";

class MicrophoneNodeDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "MicrophoneNode",
      "fft-container",
      "Add a real-time microphone input"
    );
  }

  init() {
    // setup
    this.fftEl = document.getElementById("fft-container");
    this.fftAttached = false;

    // add button to start everything
    // ...because we need uer input to request a mic node
    this.startButton = document.createElement("button");
    this.startButton.innerText = "Start";
    this.fftEl.appendChild(this.startButton);
    this.startButton.addEventListener("click", (e) => {
      this.startButton.parentNode.removeChild(this.startButton);
      this.startMic();
    });

    // add pause button
    this.pauseButton = document.createElement("button");
    this.pauseButton.innerText = "Pause";
    this.debugEl.appendChild(this.pauseButton);
    this.pauseButton.addEventListener("click", (e) => {
      this.pauseToggle();
    });
  }

  startMic() {
    // init microphone
    this.soundFFT = null;
    this.muted = false;
    this.mic = new MicrophoneNode(
      null,
      (audioContext, micNode) => {
        if (!this.soundFFT) {
          // in case we've paused & restarted
          const fftOptions = {
            fftSize: 512,
            beatAmpDirectionThresh: 0.007,
            beatAmpDirectionSamples: 10,
          };
          this.soundFFT = new SoundFFT(audioContext, micNode, fftOptions);
        } else {
          this.soundFFT.setNewSourceAudioNode(micNode);
        }
      },
      (error) => {
        this.fftEl.innerHTML =
          "[MicrophoneNode ERROR] :: " + error + "<br>Are you https:// ?";
      }
    );

    // kick off sound updates & debug animation
    this.animateFFT();
  }

  pauseToggle() {
    this.muted = this.muted ? false : true;
    this.mic.setPaused(this.muted); // handles mic disconnect, but upon unpausing, goes through initialization callback in MicrophoneNode above
  }

  keyDown(key) {
    if (key == "m") {
      this.pauseToggle();
    }
  }

  // animate fft debug canvas
  animateFFT() {
    requestAnimationFrame(() => {
      this.animateFFT();
      if (this.soundFFT) {
        this.soundFFT.update();
        this.soundFFT.drawDebug();
        this.attachDebugCanvas();
      }
    });
  }

  attachDebugCanvas() {
    if (this.fftAttached) return;
    this.fftAttached = true;
    this.fftEl.appendChild(this.soundFFT.getDebugCanvas());
  }
}

if (window.autoInitDemo) window.demo = new MicrophoneNodeDemo(document.body);
