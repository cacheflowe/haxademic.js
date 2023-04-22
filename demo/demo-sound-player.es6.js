import DemoBase from "./demo--base.es6.js";
import DOMUtil from "../src/dom-util.es6.js";
import SoundPlayer from "../src/sound-player.es6.js";

class SoundPlayerDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "SoundPlayer",
      "sound-player-demo",
      "Use Howler.js to trigger audio"
    );
  }

  init() {
    this.audioCtx = SoundPlayer.newAudioContext();
    this.sampleIds = [
      "samples/clap.wav",
      "samples/hi-hat.wav",
      "samples/kick.wav",
    ];
    this.samples = {};
    this.loadSamples();
  }

  buildPlayButton(soundId) {
    // build button
    var button = document.createElement("button");
    button.innerText = soundId;
    this.el.appendChild(button);

    // add sound player to dictionary
    this.samples[soundId] = new SoundPlayer(
      "../data/audio/" + soundId,
      () => {
        this.loadedSample();
      },
      this.audioCtx
    );

    // add button to trigger sound
    button.addEventListener("mousedown", (e) => {
      let soundPlayer = this.samples[soundId];
      soundPlayer.play();
    });
  }

  loadedSample(id) {
    // check for all loaded
    if (!this.loadedCount) this.loadedCount = 0;
    this.loadedCount++;
    // if(this.loadedCount == this.sampleIds.length + this.loopIds.length) this.allLoaded();
  }

  allLoaded() {
    console.log("allLoaded()");
    // this.playLoops();
  }

  playLoops() {
    this.loopIds.forEach((id) => this.loops[id].stop());
    setTimeout(() => {
      // this.loopIds.forEach(id => this.loops[id].play(1, 3.87097916));
      this.loopIds.forEach((id) => this.loops[id].play(1, this.loopTime));
      this.attachPlayerToFFT();
    }, 20);
  }

  attachPlayerToFFT() {
    // attach specific sound player to FFT
    let soundPlayer = this.loops[this.loopIds[3]];
    this.soundFFT.setNewSourceAudioNode(soundPlayer.getVolumeNode());
  }

  loadSamples() {
    this.el.appendChild(DOMUtil.stringToElement("<h3>Samples</h3>"));
    this.sampleIds.forEach((id) => {
      this.buildPlayButton(id, false);
    });
  }

  animateFFT() {
    if (!this.soundFFT) return;
    this.soundFFT.update();
    this.soundFFT.drawDebug();
    this.attachDebugCanvas();
  }

  attachDebugCanvas() {
    if (this.fftAttached) return;
    this.fftAttached = true;
    document.getElementById("fft").appendChild(this.soundFFT.getDebugCanvas());
  }
}

if (window.autoInitDemo) window.demo = new SoundPlayerDemo(document.body);
