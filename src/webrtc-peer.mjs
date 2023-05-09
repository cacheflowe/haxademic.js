import Peer from "../vendor/peerjs.min.js";
import QRCode from "../vendor/qrcode_.min.js";

class WebRtcPeer {
  constructor(customPeerId = null) {
    this.addScopedListeners();
    this.initServerConnection(customPeerId);
  }

  addScopedListeners() {
    this.callbackConnected = this.serverConnected.bind(this);
    this.callbackDisconnected = this.serverDisconnected.bind(this);
    this.callbackError = this.serverError.bind(this);

    this.callbackPeerConnected = this.peerConnected.bind(this);
    this.callbackPeerData = this.peerDataReceived.bind(this);
    this.callbackPeerClose = this.peerClose.bind(this);
    this.callbackPeerError = this.peerError.bind(this);

    // kiosk-only:
    this.callbackClientConnected = this.clientConnected.bind(this);
    this.callbackClientCall = this.clientCalled.bind(this);
  }

  // peer server connection listeners --------------------------------

  initServerConnection(customPeerId = null) {
    this.conn = null;

    // init connection to Peerjs server
    this.peer = new Peer(customPeerId);
    this.peer.on("open", this.callbackConnected);
    this.peer.on("disconnected", this.callbackConnected);
    this.peer.on("error", this.callbackError);

    // kiosk-only:
    this.peer.on("connection", this.callbackClientConnected);
    this.peer.on("call", this.callbackClientCall);
  }

  serverConnected(peerID) {
    this.peerID = peerID;
    this.emit("serverConnected", {});
  }

  isServerConnected() {
    return this.peer.open;
  }

  serverDisconnected() {
    console.log("Server disconnected!");
    this.emit("serverDisconnected", {});
  }

  serverError(err) {
    console.log("PeerJS server error", err, err.type);
    this.emit("serverError", { err, type: err.type });
  }

  checkServerConnection() {
    if (this.isServerConnected() == false) {
      this.manageConnections();
      this.peer.reconnect();
    }
  }

  // peer-to-peer connection listeners --------------------------

  addConnectionListeners(conn) {
    if (!conn) return;
    conn.on("open", this.callbackPeerConnected);
    conn.on("data", this.callbackPeerData);
    conn.on("close", this.callbackPeerClose);
    conn.on("error", this.callbackPeerError);
  }

  removeConnectionListeners(conn) {
    if (!conn) return;
    console.log("peer cleaned: " + conn.peer);
    conn.off("open", this.callbackPeerConnected);
    conn.off("data", this.callbackPeerData);
    conn.off("close", this.callbackPeerClose);
    conn.off("error", this.callbackPeerError);
  }

  clientConnected(dataConnection) {}

  clientCalled(mediaConnection) {}

  peerConnected(conn) {
    this.emit("peerConnected", conn);
  }

  peerClose() {
    console.log("peerClose");
    this.emit("peerClose", {});
  }

  peerError(err) {
    console.log("peerError", err, err.type);
  }

  // JSON communication on dataChannel --------------------------

  sendJSON(data, conn = this.conn) {
    if (conn) {
      data.sender = this.peerID;
      conn.send(data);
      console.log("sent data:", data);
    } else console.log("No connection, can't send data");
  }

  peerDataReceived(data) {
    console.log("Received data:", data);
    this.emit("peerDataReceived", data);
  }

  // event listener system -------------------------------------------
  // borrowed from: https://github.com/jeromeetienne/microevent.js/blob/master/microevent.js

  addListener(event, fct) {
    this._events = this._events || {};
    this._events[event] = this._events[event] || [];
    this._events[event].push(fct);
  }

  removeListener(event, fct) {
    this._events = this._events || {};
    if (event in this._events === false) return;
    this._events[event].splice(this._events[event].indexOf(fct), 1);
  }

  emit(event /* , args... */) {
    this._events = this._events || {};
    if (event in this._events === false) return;
    for (var i = 0; i < this._events[event].length; i++) {
      this._events[event][i].apply(
        this,
        Array.prototype.slice.call(arguments, 1)
      );
    }
  }

  // clean up --------------------------------------------

  dispose() {
    this.peer.off("open", this.callbackConnected);
    this.peer.off("disconnected", this.callbackConnected);
    this.peer.off("error", this.callbackError);

    // kiosk-only:
    this.peer.off("connection", this.callbackClientConnected);
    this.peer.off("call", this.callbackClientCall);

    this._events = null;
  }
}

//////////////////////////////
// Kiosk
//////////////////////////////

class WebRtcKiosk extends WebRtcPeer {
  constructor(maxClientConnectionTime = 60 * 1000 * 5, customPeerId = null) {
    super(customPeerId);
    console.log("KIOSK");
    this.maxClientConnectionTime = maxClientConnectionTime;
    this.connections = [];
    this.reconnectInterval = setInterval(() => {
      this.checkServerConnection();
    }, 10000);
  }

  checkServerConnection() {
    super.checkServerConnection();
    this.manageConnections();
  }

  serverConnected(peerID) {
    super.serverConnected(peerID);
    this.buildQrCode();
  }

  async buildQrCode(urlParams = "") {
    // can override with your own urlParams
    // build URL for client connection
    let connectionURL = `${window.location.href}&offer=${this.peerID}${urlParams}`;

    // add link container if it doesn't exist
    if (!this.offerLink) {
      this.offerLink = document.createElement("a");
    }

    // add QR code
    // - update wrapped link
    // - create/update canvas for QR code
    this.offerLink.innerHTML = "";
    this.offerLink.href = connectionURL;
    this.canvas = this.canvas ? this.canvas : document.createElement("canvas");
    this.offerLink.appendChild(this.canvas);
    // build QR code
    let options = {
      errorCorrectionLevel: "Q", // L, M, Q, H
      margin: 4,
      scale: 5, // pixels per square
      width: 256, // overides `scale`
      color: {
        dark: "#000000",
        light: "#ff2222",
      },
    };
    await QRCode.toCanvas(this.canvas, connectionURL, options);
    this.emit("qrCode", this.offerLink);
  }

  serverDisconnected() {
    super.serverDisconnected();
    // hide QR code if no connection to peer server
    if (this.offerLink) this.offerLink.innerHTML = "";
  }

  clientConnected(conn) {
    if (!conn) return;
    let newConnId = conn.peer;
    this.addConnectionListeners(conn);
    this.connections.push(conn);
    conn.connectTime = Date.now(); // add connection start time to object
    this.emit("clientConnected", conn);
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
      // console.log(conn);
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
    this.emit("connections", this.connections);
  }

  closeAllConnections() {
    this.connections.forEach((conn, i) => {
      this.removeConnectionListeners(conn);
      conn.close();
    });
    this.connections = [];
  }

  dispose() {
    clearInterval(this.reconnectInterval);
    this.closeAllConnections();
    super.dispose();
  }
}

//////////////////////////////
// Client
//////////////////////////////

class WebRtcClient extends WebRtcPeer {
  constructor(offer) {
    super();
    this.offer = offer;
  }

  serverConnected(peerID) {
    super.serverConnected(peerID);
    console.log("Client connected to Peer server");
    this.connectToKiosk();
  }

  connectToKiosk() {
    console.log("Connecting to kiosk...", this.offer);
    this.conn = this.peer.connect(this.offer);
    this.addConnectionListeners(this.conn);
  }
}

export { WebRtcPeer, WebRtcKiosk, WebRtcClient };
