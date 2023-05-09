import DemoBase from "./demo--base.es6.js";
import URLUtil from "../src/url-util.es6.js";
import { WebRtcClient, WebRtcKiosk } from "../src/webrtc-peer.mjs";

class WebRtcVideoCall extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "WebRTC | PeerJS video call",
      "webrtc-video-call-container",
      "Scan the QR code, and you should see a peer-to-peer video call!"
    );
  }

  init() {
    URLUtil.reloadOnHashChange(); // helps w/pasting the offer link from kiosk tab
    this.addNotyf();
    this.peerVideoEl = null;
    let offer = URLUtil.getHashQueryVariable("offer");
    if (offer) {
      this.buildClient(offer);
    } else {
      this.buildKiosk();
    }
  }

  buildKiosk() {
    this.kiosk = new WebRtcKiosk();
    this.kiosk.loadWebcam();
    this.kiosk.addListener("webcamInitialized", (stream) => {
      this.kiosk.displayVideoStream(this.el);
      _notyfSuccess("webcamInitialized");
    });
    this.kiosk.addListener("clientStreamStarted", ({ stream }) => {
      // for multiple clients, you'd need to keep track of the video elements
      // and remove them when the client disconnects. we could use the peerID as a key
      this.peerVideoEl = this.kiosk.displayVideoStream(
        this.el,
        stream,
        this.peerVideoEl
      );
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
      // for multiple clients, we would also need to track the video elements
      // maybe they could automatically remove themselves when the `conn` is closed/cleaned?
      // can also use "peerClose", instead of "clientStreamClosed", which isn't working right now
      this.peerVideoEl.remove();
      this.peerVideoEl = null;
      _notyfSuccess("Call ended");
    });
  }

  buildClient(offer) {
    this.client = new WebRtcClient(offer);
    this.client.loadWebcam();
    this.client.addListener("webcamInitialized", () => {
      this.client.displayVideoStream(this.el);
      _notyfSuccess("webcamInitialized");
    });
    this.client.addListener("kioskStreamStarted", ({ stream }) => {
      this.peerVideoEl = this.client.displayVideoStream(
        this.el,
        stream,
        this.peerVideoEl
      );
      _notyfSuccess("kioskStreamStarted");
    });
    this.client.addListener("peerConnected", (data) => {
      this.buildCallButtonForClient();
    });
    this.client.addListener("kioskStreamClosed", (data) => {
      // can also use "peerClose", instead of "kioskStreamClosed"
      this.peerVideoEl.remove();
      this.peerVideoEl = null;
      _notyfSuccess("Call ended");
    });
    this.client.addListener("serverError", (data) => {
      this.debugEl.innerHTML = "Bad offer from kiosk";
      _notyfError("Couldn't connect: Bad offer");
    });
  }

  buildCallButtonForClient() {
    let callButton = document.createElement("button");
    callButton.innerText = "Call Kiosk";
    callButton.addEventListener("click", () => {
      this.client.callKiosk();
    });
    this.el.appendChild(callButton);
  }
}

if (window.autoInitDemo) window.demo = new WebRtcVideoCall(document.body);
