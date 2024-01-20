import DemoBase from "./demo--base.js";
import URLUtil from "../src/url-util.js";
import VideoUtil from "../src/video-util.js";
import { WebRtcClient, WebRtcKiosk } from "../src/webrtc-peer.js";

class WebRtcClientVideoStream extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "WebRTC | One-way Video stream",
      "webrtc-video-stream-container",
      "Scan the QR code, and you should see a peer-to-peer video call inside of a vanilla video element"
    );
  }

  init() {
    URLUtil.reloadOnHashChange(); // helps w/pasting the offer link from kiosk tab
    this.addNotyf();
    let offer = URLUtil.getHashQueryVariable("offer");
    if (offer) {
      this.buildClient(offer);
    } else {
      this.buildKiosk();
      this.buildVideoPlayer();
    }
  }

  buildKiosk() {
    this.kiosk = new WebRtcKiosk();
    this.kiosk.addListener("clientStreamStarted", ({ stream }) => {
      this.videoEl.srcObject = stream;
      _notyfSuccess("clientStreamStarted");
    });
    this.kiosk.addListener("qrCode", (qrEl) => {
      this.el.appendChild(qrEl);
      _notyfSuccess("QR code generated");
    });
    this.kiosk.addListener("clientCalled", ({ conn, call, callPeerId }) => {
      this.kiosk.replyToCall(call);
      _notyfSuccess("clientCalled");
    });
    this.kiosk.addListener("peerClose", (data) => {
      // stop video feed?
      _notyfSuccess("Call ended");
    });
  }

  buildClient(offer) {
    // client loads webcam and calls kiosk when the initial connection is made,
    // though with a little delay - calling immediately causes an error
    // also, defer connecting to the kiosk until the webcam is initialized
    this.client = new WebRtcClient(offer);
    this.client.addListener("webcamInitialized", (stream) => {
      this.client.displayVideoStream(this.el);
      this.client.callKiosk();
      _notyfSuccess("webcamInitialized");
    });
    this.client.addListener("peerConnected", (data) => {
      this.client.loadWebcam(false, true);
    });
    this.client.addListener("serverError", (data) => {
      this.debugEl.innerHTML = "Bad offer from kiosk";
      _notyfError("Couldn't connect: Bad offer");
    });
  }

  // PIXI.js components & animation ------------------------------

  buildVideoPlayer() {
    let videoPath = "../data/videos/test-pattern.mp4";
    this.videoEl = VideoUtil.buildVideoEl(videoPath, true);
    this.videoEl.style.setProperty("width", "100%"); // for debug view
    this.videoEl.style.setProperty("border", "1px solid #090");
    this.el.appendChild(this.videoEl);
  }
}

if (window.autoInitDemo)
  window.demo = new WebRtcClientVideoStream(document.body);
