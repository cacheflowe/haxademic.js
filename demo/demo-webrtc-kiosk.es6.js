import DemoBase from "./demo--base.es6.js";
import DOMUtil from "../src/dom-util.es6.js";
import URLUtil from "../src/url-util.es6.js";
import { WebRtcClient, WebRtcKiosk } from "../src/webrtc-peer.mjs";

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
    URLUtil.reloadOnHashChange(); // helps w/pasting the offer link from kiosk tab
    this.addNotyf();
    let offer = URLUtil.getHashQueryVariable("offer");
    let qrId = URLUtil.getHashQueryVariable("qrId");
    if (offer) {
      this.client = new ClientCustom(offer, qrId);
    } else {
      this.client = new KioskCustom(this);
    }
  }
}

//////////////////////////////
// Custom classes
//////////////////////////////

class KioskCustom extends WebRtcKiosk {
  // Custom kiosk features:
  // - Advertise the kiosk connection via QR code
  // - Disconnect from server after 3 minutes
  // - Keep list of active users

  static MAX_SESSION_LENGTH = 1000 * 60 * 3; // 3 minutes

  constructor(demoApp) {
    super(demoApp.el, KioskCustom.MAX_SESSION_LENGTH);

    // for debugging --
    this.el = demoApp.el;
    this.demoApp = demoApp;
  }

  // overrides for debugging notifications ------------

  buildQrCode(container) {
    this.qrId = this.generateUUID();
    super.buildQrCode(container, `&qrId=${this.qrId}`);

    // log the connection
    this.demoApp.notyfSuccess("Kiosk connected to Peer server");
    this.demoApp.notyfSuccess("Listening for clients...");
  }

  // overrides for debugging notifications ------------

  peerConnected() {
    super.peerConnected();
    this.demoApp.notyfSuccess("peerConnected");
  }

  clientConnected(conn) {
    super.clientConnected(conn);
    this.demoApp.notyfSuccess("Client connected!");
  }

  peerDataReceived(data) {
    super.peerDataReceived(data);
    // get sender connection
    let senderPeerID = data.sender;
    let conn = this.connections.find((c) => c.peer == senderPeerID);

    // check handshake message
    if (data.cmd === "handshake") {
      if (this.qrId == data.qrId) {
        // qrID matches one-time QR code
        this.sendJSON(conn, { cmd: "handshakeSuccess" });
        this.buildQrCode(this.qrContainer);
      } else {
        conn.close(); // will be cleaned up by manageConnections()
      }
    }

    // check for name
    if (data.cmd === "username") {
      conn.username = data.name;
      this.manageConnections();
    }
    this.demoApp.notyfSuccess("peerData" + data);
  }

  manageConnections() {
    super.manageConnections();
    // debug connection info
    let users = this.connections.map((c) => c.username).join(", ");
    this.demoApp.debugEl.innerHTML = `
      <div>Connections: ${this.connections.length}</div>
      <div>Users: ${users}</div>
      <div>isServerConnected: ${this.isServerConnected()}</div>
    `;
  }
}

class ClientCustom extends WebRtcClient {
  // Custom client features:
  // - Send username
  // - Disconnect if handshake fails (based on qrId)
  // - Advance if handshake is successful

  constructor(offer, qrId) {
    super(offer);
    this.qrId = qrId;
  }

  peerConnected() {
    // on connection, send handshake request
    this.sendJSON(this.conn, { cmd: "handshake", qrId: this.qrId });
  }

  peerDataReceived(data) {
    console.log("Received data:", data);
    if (data.cmd == "handshakeSuccess") {
      console.log("Connection success! Show UI...");
      this.showTextInput();
    }
  }

  serverError(err) {
    super.serverError(err);
    console.log("We couldn't connect!");
  }

  peerClose() {
    super.peerClose();
    // we got kicked out - do something here
    console.log("We got kicked out!");
  }

  // for demo only -------------

  showTextInput() {
    // inject form html
    document.getElementById("debug").innerHTML = `
      <div>Connected to kiosk!</div>
      <div>Enter your name:</div>
      <input id="name" type="text" />
      <button id="submit">Submit</button>
    `;

    // add event listener
    document.getElementById("submit").addEventListener("click", () => {
      let name = document.getElementById("name").value;
      this.sendJSON(this.conn, { cmd: "username", name: name });
      // this.close();
    });
  }
}

if (window.autoInitDemo) window.demo = new WebRtcKioskDemo(document.body);
