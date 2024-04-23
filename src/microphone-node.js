class MicrophoneNode {
  constructor(context, successCallback, errorCallback) {
    this.successCallback = successCallback;
    this.errorCallback = errorCallback;
    // get audio context
    if (window.webkitAudioContext)
      window.AudioContext = window.webkitAudioContext; // mobile safari fix
    this.context = context || new AudioContext();

    // access audio input device
    try {
      this.initAudioDevice();
    } catch (e) {
      if (this.errorCallback)
        this.errorCallback(
          "Error initializing audio device. Check localhost/https. Use chrome flags if no SSL."
        );
      else console.error("Error initializing audio device: ", e);
    }
  }

  initAudioDevice() {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        this.stream = stream;
        this.micNode = this.context.createMediaStreamSource(stream);
        window.micNode = this.micNode; // fix for FF bug: https://stackoverflow.com/questions/22860468/html5-microphone-capture-stops-after-5-seconds-in-firefox
        this.successCallback(this.context, this.micNode);
      })
      .catch((err) => {
        if (this.errorCallback) this.errorCallback(err);
        else console.log("The following getUserMedia error occured: " + err);
      });
  }

  setPaused(isPaused) {
    if (isPaused) {
      // this.context.suspend();
      this.stream.getAudioTracks()[0].stop();
    } else {
      // this.context.resume();
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
