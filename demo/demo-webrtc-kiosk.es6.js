import DemoBase from "./demo--base.es6.js";
import DOMUtil from "../src/dom-util.es6.js";
import URLUtil from "../src/url-util.es6.js";

class WebRtcKioskDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [
        "!https://unpkg.com/peerjs@1.4.7/dist/peerjs.min.js",
        "!https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js",
      ],
      "WebRTC | PeerJS Kiosk",
      "webrtc-container",
      "Just scan the QR code, and connect to the kiosk as a client"
    );
  }

  // TODO:
  // - Add a uuid for the current QR code, so we can check that the user can only scan once

  init() {
    this.addNotyf();
    let offer = URLUtil.getHashQueryVariable("offer");
    if (offer) {
      this.client = new WebRtcClient(this, offer);
    } else {
      this.client = new WebRtcKiosk(this);
    }
  }
}

//////////////////////////////
// Shared super class
//////////////////////////////

class WebRtcPeer {
  constructor(demoApp, el) {
    this.demoApp = demoApp;
    this.el = el;
    this.addScopedListeners();
    this.initPeerConnection();
  }

  addScopedListeners() {
    this.callbackConnected = this.serverConnected.bind(this);
    this.callbackDisconnected = this.serverDisconnected.bind(this);
    this.callbackError = this.serverError.bind(this);

    this.callbackPeerConnected = this.peerConnected.bind(this);
    this.callbackPeerData = this.peerData.bind(this);
    this.callbackPeerClose = this.peerClose.bind(this);
    this.callbackPeerError = this.peerError.bind(this);

    // kiosk-only:
    this.callbackClientConnected = this.clientConnected.bind(this);
  }

  // peer server connection listeners --------------------------------

  initPeerConnection() {
    this.conn = null;

    // init connection to Peerjs server
    this.peer = new Peer();
    this.peer.on("open", this.callbackConnected);
    this.peer.on("disconnected", this.callbackConnected);
    this.peer.on("error", this.callbackError);

    // kiosk-only:
    this.peer.on("connection", this.callbackClientConnected);
  }

  serverConnected(peerID) {
    this.peerID = peerID;
    // log the connection
    this.el.appendChild(
      DOMUtil.stringToElement(
        `<div><p>Connected with peerID: <pre>${peerID}</pre></p></div>`
      )
    );
  }

  isServerConnected() {
    return this.peer.disconnected === false;
  }

  serverDisconnected() {
    this.demoApp.notyfError("Server disconnected!");
  }

  serverError(err) {
    console.error(err);
    this.demoApp.notyfError(err.type);
  }

  checkServerConnection() {
    console.log("this.isServerConnected", this.isServerConnected());
    if (this.isServerConnected() == false) {
      this.peer.reconnect();
    }
  }

  // peer-to-peer connection listeners --------------------------

  addConnectionListeners(conn) {
    conn.on("open", this.callbackPeerConnected);
    conn.on("data", this.callbackPeerData);
    conn.on("close", this.callbackPeerClose);
    conn.on("error", this.callbackPeerError);
  }

  removeConnectionListeners(conn) {
    this.demoApp.notyfError("peer cleaned: " + conn.peer);
    conn.off("open", this.callbackPeerConnected);
    conn.off("data", this.callbackPeerData);
    conn.off("close", this.callbackPeerClose);
    conn.off("error", this.callbackPeerError);
  }

  clientConnected(conn) {}

  peerConnected() {
    this.demoApp.notyfSuccess("peerConnected");
    setTimeout(() => {
      this.sendJSON({ cmd: "message", base64Img: "HELLO" });
    }, 1000);
  }

  peerData(data) {
    this.receiveData(data);
    this.demoApp.notyfSuccess("peerData" + data);
  }

  peerClose() {
    this.demoApp.notyfError("peerClose");
  }

  peerError(err) {
    this.demoApp.notyfError("peerError" + err.type);
  }

  // JSON communication on dataChannel --------------------------

  sendJSON(data) {
    if (this.conn) {
      this.conn.send(data);
      console.log("sent data:", data);
    } else console.error("No connection, can't send data");
  }

  receiveData(data) {
    console.log("Received data:", data);
    this.demoApp.notyfSuccess("Data cmd: " + data.cmd);
  }
}

//////////////////////////////
// Kiosk
//////////////////////////////

class WebRtcKiosk extends WebRtcPeer {
  constructor(demoApp) {
    super(demoApp, demoApp.el);
    this.maxClientConnectionTime = 1000 * 60 * 3; // 3 minutes
    this.buildQRContainer();
    this.connections = [];
    console.important("KIOSK");
    this.reconnectInterval = setInterval(() => {
      this.checkServerConnection();
    }, 5000);
  }

  buildQRContainer() {
    let qrContainer = document.createElement("div");
    qrContainer.id = "qrcode";
    this.el.appendChild(qrContainer);
  }

  checkServerConnection() {
    super.checkServerConnection();
    this.manageConnections();
  }

  serverConnected(peerID) {
    super.serverConnected(peerID);
    this.demoApp.notyfSuccess("Kiosk connected to Peer server");
    this.demoApp.notyfSuccess("Listening for clients...");
    this.advertiseKioskConnection(peerID);
  }

  async advertiseKioskConnection(peerID) {
    // add link to connect
    let offerLink = document.createElement("a");
    offerLink.href = `${window.location.href}&offer=${peerID}`;
    offerLink.innerText = offerLink.href;
    this.el.appendChild(offerLink);

    // add QR code
    let qrCode = new QRCode("qrcode", offerLink.href);
  }

  clientConnected(conn) {
    let newConnId = conn.peer;
    this.addConnectionListeners(conn);
    this.connections.push(conn);
    conn.connectTime = Date.now();
    console.log("Client connected!", newConnId);
    this.demoApp.notyfSuccess("Client connected!");
    setTimeout(() => this.manageConnections(), 1000);
  }

  connectionIsGood(conn) {
    return (
      conn.open && Date.now() - conn.connectTime < this.maxClientConnectionTime
    );
  }

  peerClose() {
    super.peerClose();
    this.manageConnections();
  }

  manageConnections() {
    // remove any connections that have been closed
    let removedAny = false;
    this.connections.forEach((conn, i) => {
      console.log(conn);
      if (this.connectionIsGood(conn) == false) {
        this.removeConnectionListeners(conn);
        conn.close();
        removedAny = true;
      }
    });
    // filter old connections from array
    if (removedAny) {
      this.connections = this.connections.filter((conn) => {
        return this.connectionIsGood(conn);
      });
    }
    // update debug info
    this.demoApp.debugEl.innerHTML = `
      <div>Connections: ${this.connections.length}</div>
      <div>isServerConnected: ${this.isServerConnected()}</div>
    `;
  }
}

//////////////////////////////
// Client
//////////////////////////////

class WebRtcClient extends WebRtcPeer {
  constructor(demoApp, offer) {
    super(demoApp, demoApp.el);
    this.offer = offer;
  }

  serverConnected(peerID) {
    super.serverConnected(peerID);
    this.demoApp.notyfSuccess("Client connected to Peer server");
    this.peerID = peerID;
    this.connectToKiosk();
  }

  connectToKiosk() {
    this.demoApp.notyfSuccess("Connecting to kiosk...");
    this.conn = this.peer.connect(this.offer);
    this.addConnectionListeners(this.conn);
  }

  // serverError(err) {
  //   // attempt to reconnect here?
  //   // but only if we're a kiosk?
  //   // this.peer.destroy();
  //   super.serverError(err);
  // }
}

if (window.autoInitDemo) window.demo = new WebRtcKioskDemo(document.body);
