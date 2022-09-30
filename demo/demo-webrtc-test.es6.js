import DemoBase from "./demo--base.es6.js";
import URLUtil from "../src/url-util.es6.js";

class WebRtcTest extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [
        "!https://unpkg.com/peerjs@1.3.2/dist/peerjs.min.js",
        "!https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js",
      ],
      "WebRTC",
      "webrtc-container"
    );
  }

  init() {
    // is there an offer in the URL?
    this.offer = URLUtil.getHashQueryVariable("offer");
    if (this.offer) {
      console.log("offer:", this.offer);
    }

    // create peer object
    this.peer = new Peer();
    this.conn = null;
    this.isKiosk = !this.offer;

    // connect to peer server, and init connections
    if (this.isKiosk) {
      this.initKiosk();
    } else {
      this.initClient();
    }

    // add listener
    document.body.addEventListener("click", (e) => {
      this.sendJSON(42);
      console.log("click!", this.conn);
    });
  }

  //////////////////////////////////////
  // kiosk connection
  //////////////////////////////////////

  async imageUrlToBase64(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((onSuccess, onError) => {
      try {
        const reader = new FileReader();
        reader.onload = function () {
          onSuccess(this.result);
        };
        reader.readAsDataURL(blob);
      } catch (e) {
        onError(e);
      }
    });
  }

  initKiosk() {
    // if no offer, we're the host! so advertise the link upon connection to server
    this.peer.on("open", (peerID) => {
      console.log("Kiosk connected w/peerID", peerID);
      this.advertiseConnection(peerID);
    });
    this.initKioskConnectionListeners();
  }

  async advertiseConnection(peerID) {
    // load image
    this.base64Img = await this.imageUrlToBase64("../data/images/bb.jpg");
    let img = document.createElement("img");
    img.src = this.base64Img;
    img.style.setProperty("width", "100%");
    this.el.appendChild(img);

    // add link to connect
    let offerLink = document.createElement("a");
    offerLink.href = `${window.location.href}&offer=${peerID}`;
    offerLink.innerText = offerLink.href;
    this.el.appendChild(offerLink);

    // add QR code
    let qrContainer = document.createElement("div");
    qrContainer.id = "qrcode";
    this.el.appendChild(qrContainer);
    let qrCode = new QRCode("qrcode", offerLink.href);
  }

  initKioskConnectionListeners() {
    console.log("LISTENING FOR CLIENTS");
    this.peer.on("connection", (conn) => {
      this.conn = conn;
      console.log("Client connected!", this.conn);

      setTimeout(() => {
        this.sendJSON({ cmd: "image", base64Img: this.base64Img });
      }, 1000);

      this.conn.on("open", () => {
        console.log("Kiosk: open connection!");
      });

      this.conn.on("data", (data) => {
        console.log("Kiosk: on data!", data);
        this.receiveData(data);
      });
    });
  }

  //////////////////////////////////////
  // client connection
  //////////////////////////////////////

  initClient() {
    this.peer.on("open", (peerID) => {
      this.conn = this.peer.connect(this.offer);
      console.log("Client connecting to:", this.offer, this.conn);

      // add listeners
      this.conn.on("connection", (data) => {
        console.log("client: client connected!", data);
      });

      this.conn.on("data", (data) => {
        console.log("client: on data!", data);
        this.receiveData(data);
      });
    });
  }

  //////////////////////////////////////
  // data transport
  //////////////////////////////////////

  sendJSON(data) {
    if (this.conn) {
      this.conn.send(data);
      console.log("sent data:", data);
    } else console.error("No connection, can't send data");
  }

  receiveData(data) {
    console.log("Received data:", data);
    if (!!data && data.cmd == "image") {
      let img = document.createElement("img");
      img.src = data.base64Img;
      this.el.appendChild(img);
    }
  }
}

if (window.autoInitDemo) window.demo = new WebRtcTest(document.body);
