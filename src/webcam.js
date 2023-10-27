class Webcam {
  constructor(callback, errorCallback, videoOptions = true) {
    navigator.mediaDevices
      .getUserMedia({ video: videoOptions })
      .then((stream) => {
        // add video stream to video element and return it
        let videoEl = document.createElement("video");
        videoEl.setAttribute("autoplay", true);
        videoEl.setAttribute("playsinline", true);
        videoEl.srcObject = stream;
        callback(videoEl);
      })
      .catch((error) => {
        if (errorCallback) errorCallback(error);
        else console.error("Error accessing media devices.", error);
      });
  }

  static flipH(videoEl) {
    videoEl.style.transform = "rotateY(180deg)";
  }

  static getVideoDeviceList() {
    navigator.mediaDevices.enumerateDevices().then(function (devices) {
      for (var i = 0; i !== devices.length; ++i) {
        if (devices[i].kind === "videoinput") {
          console.log(
            "Camera found: ",
            devices[i].label || "label not found",
            devices[i].deviceId || "id not found",
            devices[i].getCapabilities()
          );
        }
      }
    });
  }

  static backFacingOptions() {
    return {
      facingMode: "environment",
    };
  }

  static hdOptions() {
    return {
      facingMode: "user",
      width: 1920,
      height: 1080,
    };
  }
}

export default Webcam;
