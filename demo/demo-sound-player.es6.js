import DemoBase from './demo--base.es6.js';
import SoundPlayer from '../src/sound-player.es6.js';
import DOMUtil from '../src/dom-util.es6.js';

class SoundPlayerDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [], 'SoundPlayer', 'sound-player-demo');
  }

  init() {
    this.audioCtx = SoundPlayer.newAudioContext();
    this.sampleIds = ['samples/clap.wav', 'samples/hi-hat.wav', 'samples/kick.wav'];
    this.loopIds = ['loops/bass-metallic-2.mp3', 'loops/kicks.mp3', 'loops/snares.mp3', 'loops/pet-shop-boys-being-boring-beat.mp3'];
    this.samples = {};
    this.loops = {};
    this.loopVolumes = {};
    this.buildSounds();
  }

  buildPlayButton(soundId) {
    // build button
    var button = document.createElement('button');
    button.innerText = soundId;
    this.el.appendChild(button);

    // add sound player to dictionary
    this.samples[soundId] = new SoundPlayer('../data/audio/'+soundId, () => {this.loadedSample()}, this.audioCtx);

    // add button to trigger sound
    button.addEventListener('mousedown', (e) => {
      let soundPlayer = this.samples[soundId];
      soundPlayer.play();
    });

  }

  loadedSample(id) {
    // check for all loaded
    if(!this.loadedCount) this.loadedCount = 0;
    this.loadedCount++;
    if(this.loadedCount == this.sampleIds.length + this.loopIds.length) this.allLoaded();
  }

  allLoaded() {
    console.log('allLoaded()');
    // this.playLoops();
  }

  playLoops() {
    this.loopIds.forEach(id => this.loops[id].stop());
    this.loopIds.forEach(id => this.loops[id].play(1, 3.87097916));
  }

  loadSamples() {
    this.el.appendChild(DOMUtil.stringToElement('<h3>Samples</h3>'));
    this.sampleIds.forEach(id => {
      this.buildPlayButton(id, false);
    });
  }

  loadLoops() {
    // load loops to be played at the same time
    this.el.appendChild(DOMUtil.stringToElement('<h3>Loops</h3>'));
    this.el.appendChild(DOMUtil.stringToElement('<p>Loops are synced, and have different original lengths. If one is pitched to match the length, it will fall out of sync after a while and would need to be re-triggered</p>'));
    this.loopIds.forEach(id => {
      this.loops[id] = new SoundPlayer('../data/audio/'+id, () => {this.loadedSample()}, this.audioCtx);
      this.loops[id].setLoops(true);
    });
    // this.loops[this.loopIds[0]].setEndedCallback(() => {
    //   console.log('sample ended!');
    // });

    // build buttons to start & stop loops
    var button = document.createElement('button');
    button.innerText = 'Start Loops';
    this.el.appendChild(button);
    button.addEventListener('click', (e) => {
      this.playLoops();
    });

    var button2 = document.createElement('button');
    button2.innerText = 'Stop Loops';
    this.el.appendChild(button2);
    button2.addEventListener('click', (e) => {
      this.loopIds.forEach(id => this.loops[id].stop());
    });

    // build buttons to toggle (fade) mute per channel
    this.loopIds.forEach((id, i) => {
      let fadeButton = document.createElement('button');
      this.el.appendChild(fadeButton);
      fadeButton.innerText = i+1;
      fadeButton.addEventListener('click', (e) => {
        let loop = this.loops[this.loopIds[i]];
        if(loop.getVolume() < 0.5) loop.fadeVolume(1, 1.5);
        else loop.fadeVolume(0, 1.5);
      });
    });
  }

  buildSounds() {
    // build one-shot sample players
    this.loadSamples();
    this.loadLoops();
  }

}

if(window.autoInitDemo) window.demo = new SoundPlayerDemo(document.body);
