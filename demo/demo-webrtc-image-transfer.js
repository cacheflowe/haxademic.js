import DemoBase from "./demo--base.js";
import URLUtil from "../src/url-util.js";
import ImageUtil from "../src/image-util.js";
import { WebRtcClient, WebRtcKiosk } from "../src/webrtc-peer.mjs";

class WebRtcImageTransfer extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "WebRTC | PeerJS image transfer",
      "webrtc-container",
      "Just scan the QR code, and you should be sent an image!"
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
      this.loadImage();
    }
  }

  buildKiosk() {
    this.kiosk = new WebRtcKiosk();
    this.kiosk.addListener("qrCode", (qrEl) => {
      this.el.appendChild(qrEl);
      _notyfSuccess("QR code generated");
    });
    this.kiosk.addListener("clientConnected", (conn) => {
      // send image to any connected clients
      // wait a few moments after the initial connection event
      console.log(conn);
      setTimeout(() => {
        this.kiosk.sendJSON({ cmd: "image", base64Img: this.base64Img }, conn);
      }, 200);
      _notyfSuccess("clientConnected");
    });
  }

  async loadImage() {
    this.base64Img = await ImageUtil.imageUrlToBase64("../data/images/bb.jpg");
    let img = document.createElement("img");
    img.src = this.base64Img;
    img.style.setProperty("width", "100%");
    this.el.appendChild(img);
  }

  buildClient(offer) {
    this.client = new WebRtcClient(offer);
    this.client.addListener("peerDataReceived", (data) => {
      console.log("peerDataReceived", data);
      if (!!data && data.cmd == "image") {
        let img = document.createElement("img");
        img.style.setProperty("width", "100%");
        img.src = data.base64Img;
        this.el.appendChild(img);
        _notyfSuccess("Image received");
      }
    });
    this.client.addListener("serverError", (data) => {
      this.debugEl.innerHTML = "Bad offer from kiosk";
      _notyfError("Couldn't connect: Bad offer");
    });
  }
}

if (window.autoInitDemo) window.demo = new WebRtcImageTransfer(document.body);
