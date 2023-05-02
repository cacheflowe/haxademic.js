class WebRtcPeer {
  constructor() {
    this.addScopedListeners();
    this.initServerConnection();
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
  }

  // peer server connection listeners --------------------------------

  initServerConnection() {
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
  }

  isServerConnected() {
    return this.peer.disconnected === false;
  }

  serverDisconnected() {
    console.log("Server disconnected!");
  }

  serverError(err) {
    console.log(err, err.type);
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
    console.log("peer cleaned: " + conn.peer);
    conn.off("open", this.callbackPeerConnected);
    conn.off("data", this.callbackPeerData);
    conn.off("close", this.callbackPeerClose);
    conn.off("error", this.callbackPeerError);
  }

  clientConnected(conn) {}

  peerConnected() {}

  peerClose() {
    console.log("peerClose");
  }

  peerError(err) {
    console.log("peerError" + err.type);
  }

  // JSON communication on dataChannel --------------------------

  sendJSON(conn, data) {
    if (conn) {
      data.sender = this.peerID;
      conn.send(data);
      console.log("sent data:", data);
    } else console.log("No connection, can't send data");
  }

  peerDataReceived(data) {
    console.log("Received data:", data);
  }

  // helpers --------------------------------------------

  generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      var d = new Date().getTime();
      d += performance.now(); // use high-precision timer if available
      var r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  // clean up --------------------------------------------

  dispose() {
    clearInterval(this.reconnectInterval);
    super.dispose();
  }
}

//////////////////////////////
// Kiosk
//////////////////////////////

class WebRtcKiosk extends WebRtcPeer {
  constructor(
    qrContainer = document.body,
    maxClientConnectionTime = 60 * 1000 * 5
  ) {
    super();
    console.log("KIOSK");
    this.qrContainer = qrContainer;
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
    this.buildQrCode(this.qrContainer);
  }

  buildQrCode(container, urlParams = "") {
    // can override with your own urlParams
    // build URL for client connection
    let connectionURL = `${window.location.href}&offer=${this.peerID}${urlParams}`;

    // add link container if it doesn't exist
    if (!this.offerLink) {
      this.offerLink = document.createElement("a");
      this.offerLink.id = "qrcode";
      container.appendChild(this.offerLink);
    }

    // add QR code
    this.offerLink.innerHTML = "";
    this.offerLink.href = connectionURL;
    let qrCode = new QRCode("qrcode", connectionURL);
  }

  serverDisconnected() {
    super.serverDisconnected();
    // hide QR code if no connection to peer server
    this.offerLink.innerHTML = "";
  }

  clientConnected(conn) {
    if (!conn) return;
    let newConnId = conn.peer;
    this.addConnectionListeners(conn);
    this.connections.push(conn);
    conn.connectTime = Date.now();
    console.log("Client connected!", newConnId);
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
