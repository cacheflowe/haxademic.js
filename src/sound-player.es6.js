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
    this.playOnLoad = false;
    this.loadedCallback = loadedCallback;
    this.endedCallback = null;

    if(analysisAverages > 0) this.createAnalyzer(analysisAverages);
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

  play(rate=1, newDuration=-1) {
    if(!this.buffer) {
      this.playOnLoad = true;
    } else {
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
      if(this.analyser) {
        this.volumeNode.connect( this.analyser );
        this.analyser.connect( this.audioContext.destination );
      } else {
        this.volumeNode.connect( this.audioContext.destination );
      }
      
      // set pitch
      if(newDuration > 0) {
        this.sourceNode.playbackRate.value = this.duration() / newDuration;
      } else {
        this.sourceNode.playbackRate.value = rate;
      }

      // play!
      this.sourceNode.start(0);
      this.sourceNode.onended = () => {
        if(this.endedCallback) this.endedCallback();
        if(this.loops) this.play(rate, newDuration);
      };
    }
  }

  stop() {
    if (this.sourceNode) this.sourceNode.stop(0);
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

  duration() {
    return this.sourceNode.buffer.duration;
  }

  loadAudio() {
    var request = new XMLHttpRequest();
    request.open("GET", this.audioFile, true);
    request.responseType = "arraybuffer";
    request.onload = () => {
      this.audioContext.decodeAudioData(request.response, (buffer) => { 
          this.buffer = buffer;
          if( this.playOnLoad ) this.playSound();
          if( this.loadedCallback ) this.loadedCallback(this.audioFile);
      });
    }
    request.send();
  }

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
