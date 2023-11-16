import DemoBase from "./demo--base.js";
import FrameLoop from "../src/frame-loop.js";
import SoundFFT from "../src/sound-fft.js";
import VideoUtil from "../src/video-util.js";

class SoundFFTVideoDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "SoundFFT | Video",
      "video-fft-container",
      "Press the Start button to attach video to audio analysis."
    );
  }

  init() {
    // animation loop
    window._frameLoop = new FrameLoop().addListener(this);

    // add video element
    let videoPath = "../data/videos/bball-sounds.mp4";
    this.videoEl = VideoUtil.buildVideoEl(videoPath, false);
    this.videoEl.style.setProperty("max-width", "100%");
    this.videoEl.setAttribute("controls", "true");
    this.videoEl.volume = 0.3;
    this.el.appendChild(this.videoEl);
    this.el.appendChild(document.createElement("hr"));

    // add button to start everything
    this.startButton = document.createElement("button");
    this.startButton.innerText = "Start";
    this.el.appendChild(this.startButton);

    // click video to add audio response
    this.startButton.addEventListener("click", (e) => {
      // start video & remove button
      this.videoEl.play();
      this.startButton.parentNode.removeChild(this.startButton);

      // init video & fft
      if (window.webkitAudioContext)
        window.AudioContext = window.webkitAudioContext; // mobile safari fix
      var audioCtx = new AudioContext();
      var source = audioCtx.createMediaElementSource(this.videoEl);
      this.soundFFT = new SoundFFT(audioCtx, source);
      source.connect(audioCtx.destination);
    });
  }

  frameLoop(frameCount) {
    if (this.soundFFT) {
      this.soundFFT.update();
      this.soundFFT.drawDebug();
      this.updateBg();
      this.attachDebugCanvas();
    }
  }

  updateBg() {
    let amp = Math.round(this.soundFFT.getSpectrum()[10] * 255);
    document.body.style.setProperty(
      "background-color",
      `rgba(${amp}, ${amp}, ${amp}, 1)`
    );
  }

  attachDebugCanvas() {
    if (this.fftAttached) return;
    this.fftAttached = true;
    this.el.appendChild(this.soundFFT.getDebugCanvas());
    this.soundFFT.getDebugCanvas().setAttribute("style", null);
  }
}

if (window.autoInitDemo) window.demo = new SoundFFTVideoDemo(document.body);
