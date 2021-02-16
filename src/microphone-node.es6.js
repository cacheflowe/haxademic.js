class MicrophoneNode {

  constructor(context, successCallback, errorCallback) {
    this.successCallback = successCallback;
    this.errorCallback = errorCallback;
    // get audio context
    if(window.webkitAudioContext) window.AudioContext = window.webkitAudioContext;  // mobile safari fix
    this.context = context || new AudioContext();

    // access audio input device
    this.initAudioDevice();
  }

  initAudioDevice() {
    navigator.mediaDevices.getUserMedia({audio: true})
      .then((stream) => {
        this.stream = stream;
        this.micNode = this.context.createMediaStreamSource(stream);
        window.micNode = this.micNode; // fix for FF bug: https://stackoverflow.com/questions/22860468/html5-microphone-capture-stops-after-5-seconds-in-firefox
        this.successCallback(this.micNode);
      })
      .catch((err) => {
        if(this.errorCallback) this.errorCallback(err);
        else console.log('The following getUserMedia error occured: ' + err);
      });
  }

  setPaused(isPaused) {
    if(isPaused) {
      this.stream.getAudioTracks()[0].stop();
    } else {
      this.initAudioDevice();
    }
  }

  getStream() {
    return this.stream;
  }
  
  getNode() {
    return this.micNode;
  }

  getContext() {
    return this.context;
  }

}

export default MicrophoneNode;
