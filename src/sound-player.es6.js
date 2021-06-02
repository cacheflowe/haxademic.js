class SoundPlayer {

  static newAudioContext() {
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    return new AudioContext();
  }

  constructor(audioFile, loadedCallback, context=SoundPlayer.newAudioContext(), analysisAverages=0) {
    this.audioContext = context;
    this.audioFile = audioFile;
    this.pan = 0;
    this.volume = 1;
    this.loops = false;
    this.loadAudio();
    this.playing = false;
    this.loadedCallback = loadedCallback;
    this.endedCallback = null;

    this.initTicks();
    if(analysisAverages > 0) this.createAnalyzer(analysisAverages);
  }

  initTicks() {
    this.startTime = 0;
    this.audioTimeOffset = 0.; // helps with the visual timing
    this.tickTime = 0;
    this.numTicks = 16;
    this.curTick = 0;
    this.lastTick = 0;
    this.tickChanged = false;
  }

  setNumTicks(numTicks) {
    this.numTicks = numTicks;
  }

  loadAudio() {
    const request = new XMLHttpRequest();
    request.open("GET", this.audioFile, true);
    request.responseType = "arraybuffer";
    request.onload = () => {
      this.audioContext.decodeAudioData(request.response, (buffer) => { 
          this.buffer = buffer;
          if(this.loadedCallback) this.loadedCallback(this.audioFile);
      });
    }
    request.send();
  }

  setEndedCallback(callback) {
    this.endedCallback = callback;
  }

  createAnalyzer(analysisAverages) {
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.smoothingTimeConstant = 0.5;
    // create averaged analysis array so we're not always creating new ones
    this.averages = [];
    for(var i=0; i < analysisAverages; i++) this.averages.push(0);
  };

  loop() {
    this.loops = true;
    this.play();
  }

  play(rate=1, targetDuration=-1) {
    this.targetDuration = targetDuration;

    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.buffer;
    this.sourceNode.loop = (!!this.endedCallback) ? false : this.loops;
    // this.sourceNode.loop = false;

    this.panner = this.audioContext.createPanner();
    this.panner.setPosition(this.pan, 0, 0);
    this.sourceNode.connect(this.panner);

    this.volumeNode = this.audioContext.createGain();
    this.volumeNode.gain.value = this.volume;
    this.panner.connect(this.volumeNode);

    // add pan node
    if(this.analyser) {
      this.volumeNode.connect( this.analyser );
      this.analyser.connect( this.audioContext.destination );
    } else {
      this.volumeNode.connect( this.audioContext.destination );
    }
    
    // set pitch
    if(this.targetDuration > 0) {
      this.sourceNode.playbackRate.value = this.durationOrig() / this.targetDuration;
    } else {
      this.sourceNode.playbackRate.value = rate;
    }

    // play!
    this.playing = true;
    this.sourceNode.start(0);
    this.startTime = this.audioContext.currentTime; // for ticks (and pausing if implemented later)
    this.sourceNode.onended = () => {
      if(this.endedCallback) this.endedCallback();
      if(this.loops && this.playing) this.play(rate, this.targetDuration);
    };

    // return node
    return this.sourceNode;
  }

  getNode() {
    return this.sourceNode;
  }
  
  getVolumeNode() {
    return this.volumeNode;
  }

  stop() {
    this.playing = false;
    if(this.sourceNode) {
      this.sourceNode.onended = null;
      this.sourceNode.stop(0);
    }
  }

  getVolume() {
    return this.volume;
  }

  setVolume(volume) {
    this.volume = volume;
    this.volumeNode.gain.value = this.volume;
  }

  fadeVolume(volume, fadeSeconds) {
    if(volume < 0.0001) volume = 0.0001;
    this.volume = volume;
    this.volumeNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + fadeSeconds);
  }

  setPan(pan) {
    this.pan = pan;
  }

  setLoops(loops) {
    this.loops = loops;
  }

  isPlaying() {
    return this.playing;
  }

  durationOrig() {
    return this.sourceNode.buffer.duration;
  }

  curDuration() {
    return (this.targetDuration > 0) ? this.targetDuration : this.durationOrig();
  }
  
  // Ticks

  updateTicks() {
    // don't calculate ticks if sound isn't loaded or playing
    if(!this.sourceNode) return;
    if(!this.playing) {
      this.lastTick = this.curTick = 0; 
      return;
    }
    // calculate ticks based on current time and target duration
    this.tickTime = (this.curDuration() / this.durationOrig()) * this.durationOrig() / this.numTicks;
    this.playbackTime = (this.audioContext.currentTime - this.startTime) % this.curDuration() + this.audioTimeOffset;
    this.curTick = Math.floor(this.playbackTime / this.tickTime) % this.numTicks;
    this.tickChanged = (this.curTick != this.lastTick);
    this.lastTick = this.curTick;
  }

  // FFT

  getSpectrum() {
    var freqByteData = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(freqByteData);
    return freqByteData;
  };

  getAveragedSpectrum() {
    var freqByteData = this.getSpectrum();
    // store averaged data
    var j = 0,
        i = 0,
        step = 0;
    // optimized Math.floor()ing depending on whether the averages are less or greater than system EQ (1024)
    if( freqByteData.length > this.averages.length ) {
      step = Math.floor(freqByteData.length / this.averages.length);
      for(i=0; i < this.averages.length; i++) {
        this.averages[i] = freqByteData[j];
        j += step;
      }
    } else {
      step = freqByteData.length / this.averages.length;
      for(i=0; i < this.averages.length; i++) {
        this.averages[i] = freqByteData[Math.floor(j)];
        j += step;
      }
    }
    return this.averages;
  }

}

export default SoundPlayer;
