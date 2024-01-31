import Peer from "../vendor/peerjs.min.js";
import QRCode from "../vendor/qrcode_.min.js";

class WebRtcPeer {
  constructor(customPeerId = null, peerJsOptions = {}) {
    this.addScopedListeners();
    this.initServerConnection(customPeerId, peerJsOptions);
  }

  addScopedListeners() {
    this.callbackConnected = this.serverConnected.bind(this);
    this.callbackDisconnected = this.serverDisconnected.bind(this);
    this.callbackError = this.serverError.bind(this);

    this.callbackPeerConnected = this.peerConnected.bind(this);
    this.callbackPeerData = this.peerDataReceived.bind(this);
    this.callbackPeerClose = this.peerClose.bind(this);
    this.callbackPeerError = this.peerError.bind(this);

    this.buildCallListeners();

    // kiosk-only:
    this.callbackClientConnected = this.clientConnected.bind(this);
    this.callbackClientCall = this.clientCalled.bind(this);
  }

  // peer server connection listeners --------------------------------

  initServerConnection(customPeerId = null, peerJsOptions = {}) {
    this.conn = null;

    // init connection to Peerjs server
    this.peer = new Peer(customPeerId, peerJsOptions);
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
    return this.peer && this.peer.open && !this.peer.destroyed;
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
      // console.log("❌❌❌ IT'S BAD! RECONNECTING", this.peer);
      this.manageConnections();
      this.peer.reconnect();
    } else {
      // console.log("this.peer looks good: ", this.peer);
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
  clientCalled(call) {}

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

  // JSON (or other data types) communication on dataChannel --------------------------

  sendJSON(data, conn = this.conn) {
    if (conn) {
      data.sender = this.peerID;
      conn.send(data);
      // console.log("sent data:", data);
    } else console.log("No connection, can't send data");
  }

  broadcastJSON(data) {
    if (this.connections) {
      this.connections.forEach((conn) => {
        this.sendJSON(data, conn);
      });
    } else {
      this.sendJSON(data);
    }
  }

  peerDataReceived(data) {
    // console.log("Received data:", data);
    this.emit("peerDataReceived", data);

    // set incoming data on AppStore if initialized
    // only do this if data is set from AppStore, via `.store` property
    if (window._store && data.store) {
      this.updateLocalAppStoreWithRemoteData(data);
    }
  }

  // AppStore bridge - automatically sends AppStore updates to peer and receives broadcasted updates from peer

  initAppStoreBridge(exclusions = []) {
    this.appStoreExclusions = exclusions;
    this.incomingRtcData = false; // add flag to make sure incoming data doesn't get re-emitted. maybe this causes issues if another AppStore event is emitted in the same frame? a rAf would solve for that.
    if (window._store) {
      window._store.addListener(this);
    }
  }

  storeUpdated(key, value) {
    // ignore select keys when set on AppStore - primarily to prevent outgoing data, like frameLoop
    // but would also discard incoming keys
    if (this.appStoreExclusions.indexOf(key) !== -1) return;

    // get data type for java AppStore - borrowed from AppStoreDistributed
    var type = "number";
    if (typeof value === "boolean") type = "boolean";
    if (typeof value === "string") type = "string";
    // set json object for AppStore
    let data = {
      key: key,
      value: value,
      store: true,
      type: type,
    };
    data.sender = this.peerID;
    if (!this.incomingRtcData) this.sendJsonOnAppStoreUpdate(data);
    this.incomingRtcData = false;
  }

  sendJsonOnAppStoreUpdate(data) {
    // send AppStore-formatted data to peer...
    // if multiple connections, send to all, which might not be what we want in all cases,
    // so we could override this method in a subclass to send to a specific connection
    if (this.connections) {
      this.connections.forEach((conn) => {
        this.sendJSON(data, conn);
        // console.log("sending", data, conn);
      });
    } else {
      this.sendJSON(data);
    }
  }

  updateLocalAppStoreWithRemoteData(data) {
    // make sure this isn't data being self-received from emitting our own AppStore update
    if (data.sender == this.peerID) return;
    this.incomingRtcData = true;
    // if incoming data is AppStore-formatted, set it on AppStore
    if (data["store"] && data["type"]) {
      window._store.set(data["key"], data["value"]);
    } else {
      window._store.set("CUSTOM_DATA", data);
    }
  }

  // Video call helpers -------------------------------------------

  buildCallListeners() {
    this.callbackCallStreamStart = this.callStreamStart.bind(this);
    this.callbackCallStreamClose = this.callStreamClose.bind(this);
  }

  callStreamStart() {}

  callStreamClose() {}

  addCallListeners(call) {
    call.on("stream", this.callbackCallStreamStart);
    call.on("close", this.callbackCallStreamClose);
  }
  removeCallListeners(call) {
    call.off("stream", this.callbackCallStreamStart);
    call.off("close", this.callbackCallStreamClose);
  }

  loadWebcam(streamAudio = false, mobileBackCamera = false) {
    var videoOptions = true;
    if (mobileBackCamera) videoOptions = { facingMode: "environment" };
    navigator.getUserMedia(
      { audio: streamAudio, video: videoOptions },
      (stream) => {
        this.localVideoStream = stream;
        this.emit("webcamInitialized", stream);
      },
      (err) => {
        alert("Cannot get access to your camera and video !");
        console.error(err);
      }
    );
  }

  displayVideoStream(
    container,
    stream = this.localVideoStream,
    videoEl = null
  ) {
    // Retrieve the video element according to the desired
    // mute if video since it's our own
    if (!videoEl) {
      videoEl = document.createElement("video");
      videoEl.defaultMuted = true;
      videoEl.setAttribute("muted", "true");
      videoEl.setAttribute("width", "100%");
      videoEl.setAttribute("playsinline", "playsinline");
      videoEl.setAttribute("autoplay", "autoplay");
      container.appendChild(videoEl);
    }
    videoEl.srcObject = stream;
    return videoEl;
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
  constructor(
    maxClientConnectionTime = 60 * 1000 * 5,
    customPeerId = null,
    peerJsOptions = {}
  ) {
    super(customPeerId, peerJsOptions);
    console.log("KIOSK");
    this.buildQrOptions();
    this.maxClientConnectionTime = maxClientConnectionTime;
    this.connections = [];
    this.reconnectInterval = setInterval(() => {
      this.checkServerConnection();
    }, 10000);
  }

  buildQrOptions() {
    // override to customize QR code
    this.qrOptions = {
      errorCorrectionLevel: "Q", // L, M, Q, H
      margin: 4,
      scale: 5, // pixels per square
      width: 256, // overides `scale`
      color: {
        dark: "#000",
        light: "#bbb",
      },
    };
  }

  setQrOptions(options) {
    // override specific options
    this.qrOptions = { ...this.qrOptions, ...options };
  }

  checkServerConnection() {
    super.checkServerConnection();
    this.manageConnections();
  }

  serverConnected(peerID) {
    super.serverConnected(peerID);
    this.buildQrCode();
  }

  async buildQrCode(urlParams = "", replaceFunction = null) {
    // can override with your own urlParams
    // build URL for client connection
    let url = window.location.href;
    if (replaceFunction) url = replaceFunction(url);
    let separator = url.indexOf("#") == -1 ? "#" : "%26";
    urlParams = urlParams.replace("&", "%26");
    let connectionURL = `${url}${separator}offer=${this.peerID}${urlParams}`;

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
    this.canvas.classList.add("webrtc-qr-code");
    this.offerLink.appendChild(this.canvas);
    await QRCode.toCanvas(this.canvas, connectionURL, this.qrOptions);
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
      conn.open &&
      conn.peerConnection?.connectionState == "connected" &&
      Date.now() - conn.connectTime < this.maxClientConnectionTime
    );
  }

  peerClose() {
    super.peerClose();
    this.manageConnections();
  }

  manageConnections() {
    // console.log(this.connections);
    // remove any connections that have been closed
    let removedAny = false;
    this.connections.forEach((conn, i) => {
      if (this.connectionIsGood(conn) == false) {
        this.removeConnectionListeners(conn);
        if (conn.call) this.removeCallListeners(conn.call);
        conn.close();
        removedAny = true;
      }
    });
    // console.log(removedAny);
    // filter old connections from array
    this.connections = this.connections.filter((conn) => {
      return this.connectionIsGood(conn);
    });
    this.emit("connections", this.connections);
  }

  closeAllConnections() {
    this.connections.forEach((conn, i) => {
      this.removeConnectionListeners(conn);
      if (conn.call) conn.call.close();
      conn.close();
    });
    this.connections = [];
  }

  dispose() {
    clearInterval(this.reconnectInterval);
    this.closeAllConnections();
    super.dispose();
  }

  // video call

  clientCalled(call) {
    // find connection and attach call to it
    let callPeerId = call.peer;
    let conn = this.connections.find((conn) => {
      return conn.peer === callPeerId;
    });
    if (!conn) return;
    conn.call = call;
    // add call listeners
    this.addCallListeners(call, callPeerId);
    // send event - kiosk may want to answer the call with our own video/audio stream
    this.emit("clientCalled", { conn, call, callPeerId });
  }

  callStreamStart(stream) {
    // Find conn based on stream - can we find conn.stream to match them up
    let conn = this.connections.find((conn) => {
      return conn?.call?.remoteStream === stream;
    });
    this.emit("clientStreamStarted", { conn, stream });
  }

  callStreamClose(e) {
    console.log("callStreamClose", e);
    this.emit("clientStreamClosed", {});
  }

  replyToCall(call) {
    call.answer(this.localVideoStream);
  }
}

//////////////////////////////
// Client
//////////////////////////////

class WebRtcClient extends WebRtcPeer {
  constructor(offer = null, peerJsOptions = {}) {
    super(null, peerJsOptions);
    this.offer = offer;
  }

  serverConnected(peerID) {
    super.serverConnected(peerID);
    console.log("Client connected to Peer server");
    if (this.offer) this.connectToKiosk(this.offer);
  }

  connectToKiosk(offer = this.offer) {
    console.log("Connecting to kiosk...", offer);
    this.conn = this.peer.connect(offer);
    console.log("this.conn", this.conn);
    this.addConnectionListeners(this.conn);
  }

  // video calls

  callKiosk() {
    this.call = this.peer.call(this.offer, this.localVideoStream);
    this.addCallListeners(this.call, this.offer);
  }

  callStreamStart(stream) {
    console.log("kioskStreamStarted", stream);
    this.emit("kioskStreamStarted", { stream });
  }

  callStreamClose(e) {
    console.log("kioskStreamClosed", e);
    this.emit("kioskStreamClosed", {});
  }

  dispose() {
    super.dispose();
    if (this.call) this.removeCallListeners(this.call);
  }
}

export { WebRtcPeer, WebRtcKiosk, WebRtcClient };
