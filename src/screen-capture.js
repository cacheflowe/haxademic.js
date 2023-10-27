class ScreenCapture {

  constructor(callback, errorCallback) {
    // more info & config: https://webrtc.org/getting-started/media-capture-and-constraints#media_devices
    navigator.mediaDevices.getDisplayMedia({'video': {'cursor':'always', displaySurface:'window'}})
      .then(stream => {
        // add video stream to video element and return it
        let videoEl = document.createElement('video');
        videoEl.setAttribute('autoplay', true);
        videoEl.setAttribute('playsinline', true);
        videoEl.srcObject = stream;
        callback(videoEl);
      })
      .catch(error => {
        if(errorCallback) errorCallback(error);
        else console.error('Error accessing display devices.', error);
      }
    );
  }

}

export default ScreenCapture;
