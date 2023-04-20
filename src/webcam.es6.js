//     facingMode: {
//       exact: "environment",
//     },

class Webcam {
  constructor(callback, errorCallback, mobileBackCamera = false) {
    const videoOptions = mobileBackCamera
      ? { facingMode: "environment" }
      : true;
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
}

export default Webcam;
