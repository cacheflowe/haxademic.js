import DemoBase from "./demo--base.js";
import URLUtil from "../src/url-util.js";

class WebRtcVideoCall extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [
        "!https://unpkg.com/peerjs@1.4.7/dist/peerjs.min.js",
        "!https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js",
      ],
      "WebRTC | PeerJS video call",
      "webrtc-video-call-container",
      "Scan the QR code, and you should see a peer-to-peer video call!"
    );
  }

  // From:
  // - https://peerjs.com/docs/
  // - https://github.com/ourcodeworld/videochat-peerjs-example/blob/master/public/source/js/script.js
  // Try it out:
  // - https://ourcodeworld.com/articles/read/1030/how-to-create-a-video-chat-with-peerjs-in-javascript
  // - https://cacheflowe.github.io/haxademic.js/demo/#webrtc-video-call
  // - https://192.168.1.155/haxademic.js/demo/#webrtc-video-call - apache w/ssl
  // - http://localhost:5173/demo/#webrtc-video-call - Vite

  init() {
    // is there an offer in the URL?
    this.kioskOfferId = URLUtil.getHashQueryVariable("offer");
    if (this.kioskOfferId) {
      this.log("offer:", this.kioskOfferId);
    }

    // create peer object
    this.peer = new Peer({
      id: "cacheflowe-kiosk", // make sure to remove this when not testing
    });
    this.conn = null;
    this.isKiosk = !this.kioskOfferId;
    this.clientConnections = [];

    // connect to peer server, and init connections
    if (this.isKiosk) {
      this.initKiosk();
    } else {
      this.initClient();
    }

    // load video
    this.initWebCam();
  }

  keyDown(key) {
    this.sendJSON(key);
  }

  log(...args) {
    args.forEach((arg) => {
      console.important(arg);
    });
  }

  //////////////////////////////////////
  // kiosk connection
  //////////////////////////////////////

  initKiosk() {
    this.initKioskPeerConnection();
    this.initKioskConnectionListeners();
    this.initKioskCallListeners();
  }

  initKioskPeerConnection() {
    this.peer.on("open", (peerID) => {
      this.log("Kiosk connected w/peerID", peerID);
      this.advertiseConnection(peerID);
    });
  }

  advertiseConnection(peerID) {
    // build link container
    let qrContainer = document.createElement("p");
    qrContainer.id = "qrcode";
    this.el.appendChild(qrContainer);

    // add link to connect
    let offerLink = document.createElement("a");
    offerLink.href = `${window.location.href}&offer=${peerID}`;
    offerLink.innerText = offerLink.href;
    qrContainer.appendChild(offerLink);

    // add QR code - appends to id of "qrcode"
    let qrCode = new QRCode("qrcode", offerLink.href);
  }

  initKioskConnectionListeners() {
    this.peer.on("connection", (conn) => {
      this.conn = conn;
      this.log("Client connected!", this.conn);

      this.conn.on("open", () => {
        this.log("Kiosk: open connection!");
        // setTimeout(() => {
        //   this.sendJSON({ cmd: "image", base64Img: this.base64Img });
        // }, 100);
      });

      this.conn.on("data", (data) => {
        this.log("Kiosk: on data!", data);
        this.receiveData(data);
      });
    });
  }

  initKioskCallListeners() {
    // listen for a video call from client
    this.peer.on("call", (call) => {
      let callPeerId = call.peer;
      console.log("call received from client", call);
      // answer the call with our own video/audio stream
      call.answer(this.localVideoStream);

      // video stream from client
      call.on("stream", (stream) => {
        // Store a reference of the client user stream
        if (this.clientConnections.indexOf(callPeerId) === -1) {
          console.log("Client stream added", callPeerId);
          this.streamPeer = stream;
          this.displayVideoStream(stream, false, "Client Video");
        } else {
          console.log("Client already connected", callPeerId);
        }
        // track stream connection to disallow duplicates
        this.clientConnections.push(callPeerId);
      });

      // Handle when the call finishes
      call.on("close", () => {
        alert("The videocall has finished");
      });

      // use call.close() to finish a call
    });
  }

  //////////////////////////////////////
  // client connection
  //////////////////////////////////////

  initClient() {
    this.peer.on("open", (peerID) => {
      this.clientPeerId = peerID;
      this.conn = this.peer.connect(this.kioskOfferId);
      this.log("Client connecting to:", this.kioskOfferId, this.conn);

      // show offer
      let offerText = document.createElement("p");
      offerText.innerHTML = `Offer: ${this.kioskOfferId}<br>`;
      offerText.innerHTML += `Client peer ID: ${this.clientPeerId}`;
      this.el.appendChild(offerText);

      // add listeners
      this.conn.on("connection", (data) => {
        this.log("client: client connected!", data);
      });

      // receive data from kiosk
      this.conn.on("data", (data) => {
        this.log("client: on data!", data);
        this.receiveData(data);
      });

      // add call button
      let callButton = document.createElement("button");
      callButton.innerText = "Call Kiosk";
      callButton.addEventListener("click", () => {
        this.startCallFromClient();
      });
      this.el.appendChild(callButton);
    });
  }

  initWebCam() {
    this.loadLocalWebcam({
      success: (stream) => {
        this.localVideoStream = stream;
        this.displayVideoStream(stream, true, "Local Video");
        if (!this.isKiosk) this.startCallFromClient();
      },
      error: (err) => {
        alert("Cannot get access to your camera and video !");
        console.error(err);
      },
    });
  }

  startCallFromClient() {
    // send call to kiosk
    var call = this.peer.call(this.kioskOfferId, this.localVideoStream);
    // receive stream back from kiosk after call
    call.on("stream", (stream) => {
      this.log("Replace the previous if we get a new one? This is called 2x");
      console.log(this.streamPeer, stream);
      if (!this.streamPeer) {
        this.streamPeer = stream;
        this.displayVideoStream(stream, false, "Kiosk Video");
      }
    });
  }

  //////////////////////////////////////
  // data transport
  //////////////////////////////////////

  sendJSON(data) {
    if (this.conn) {
      this.conn.send(data);
      this.log("sent data:", data);
    } // else console.error("No connection, can't send data");
  }

  receiveData(data) {
    this.log("Received data:", data);
    if (!!data && data.cmd == "image") {
      let img = document.createElement("img");
      img.style.setProperty("width", "100%");
      img.src = data.base64Img;
      this.el.appendChild(img);
    }
  }

  //////////////////////////////////////
  // video transport
  //////////////////////////////////////

  loadLocalWebcam(callbacks) {
    navigator.getUserMedia(
      { audio: true, video: true },
      callbacks.success,
      callbacks.error
    );
  }

  displayVideoStream(stream, isOwnVideo, label) {
    // build label to identify stream
    let labelEl = document.createElement("div");
    labelEl.innerText = label;
    this.el.appendChild(labelEl);

    // Retrieve the video element according to the desired
    let videoEl = document.createElement("video");
    // TODO: mute if video is our own
    if (isOwnVideo) {
      videoEl.defaultMuted = true;
      videoEl.setAttribute("muted", "true");
    }
    videoEl.setAttribute("width", "100%");
    videoEl.setAttribute("playsinline", "playsinline");
    videoEl.setAttribute("autoplay", "autoplay");
    videoEl.srcObject = stream;
    this.el.appendChild(videoEl);
  }
}

if (window.autoInitDemo) window.demo = new WebRtcVideoCall(document.body);
