class MicrophoneNode {

  constructor(context, callback, errorCallback) {
    this.context = context || new AudioContext();
    navigator.mediaDevices.getUserMedia({audio: true})
    .then((stream) => {
      this.micNode = this.context.createMediaStreamSource(stream);
      window.micNode = this.micNode; // fix for FF bug: https://stackoverflow.com/questions/22860468/html5-microphone-capture-stops-after-5-seconds-in-firefox
      callback(this.micNode);
    })
    .catch((err) => {
      if(errorCallback) errorCallback(err);
      else console.log('The following getUserMedia error occured: ' + err);
    });
  }

  getNode() {
    return this.micNode;
  }
  getContext() {
    return this.context;
  }

}

// only export if we want to treat this as a module
// export { MicrophoneNode };
