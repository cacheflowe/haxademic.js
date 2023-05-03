import DemoBase from "./demo--base.es6.js";
import URLUtil from "../src/url-util.es6.js";
import { WebRtcClient, WebRtcKiosk } from "../src/webrtc-peer.mjs";
import ShortUniqueId from "../vendor/short-unique-id.min.js";

class WebRtcKioskDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "WebRTC | PeerJS Kiosk",
      "webrtc-container",
      "Just scan the QR code, and connect to the kiosk as a client"
    );
  }

  init() {
    URLUtil.reloadOnHashChange(); // helps w/pasting the offer link from kiosk tab
    this.addNotyf();
    let offer = URLUtil.getHashQueryVariable("offer");
    let qrId = URLUtil.getHashQueryVariable("qrId");
    if (offer) {
      this.client = new ClientCustom();
      this.client.addListener("peerDataReceived", (data) => {
        console.log("peerDataReceived", data);
        if (data.cmd == "handshakeSuccess") {
          console.log("Connection success! Show UI...");
          this.showTextInput();
        }
      });
      this.client.addListener("peerClose", (data) => {
        _notyfError("peerClose!");
      });
    } else {
      this.client = new KioskCustom(this);
      this.client.addListener("qrCode", (qrEl) => {
        this.el.appendChild(qrEl);
        _notyfSuccess("Kiosk connected to Peer server");
        _notyfSuccess("Listening for clients...");
      });
      this.client.addListener("handshakeSuccess", (conn) => {
        _notyfSuccess("Client handshake success!");
      });
      this.client.addListener("peerDataReceived", (data) => {
        console.log("peerDataReceived", data);
      });
      this.client.addListener("connections", (connections) => {
        let users = connections.map((c) => c.username).join(", ");
        this.debugEl.innerHTML = `
          <div>Connections: ${connections.length}</div>
          <div>Users: ${users}</div>
          <div>isServerConnected: ${this.client.isServerConnected()}</div>
        `;
      });
      this.client.addListener("usernames", (usernamesArray) => {
        this.debugEl.innerHTML += `
          <div>Usernamess: ${usernamesArray.join(", ")}</div>
        `;
      });
    }
  }

  showTextInput() {
    // inject form html
    this.debugEl.innerHTML = `
      <div>Connected to kiosk!</div>
      <div>Enter your name:</div>
      <input id="name" type="text" />
      <button id="submit">Submit</button>
    `;

    // add event listener
    document.getElementById("submit").addEventListener("click", () => {
      let name = document.getElementById("name").value;
      this.client.sendJSON({ cmd: "username", name: name });
      // this.close();
    });
  }
}

//////////////////////////////
// Custom classes
//////////////////////////////

class KioskCustom extends WebRtcKiosk {
  // Custom kiosk features:
  // - Advertise the kiosk connection via single-use QR code
  // - Disconnect clients from server after 3 minutes\
  // - Handshake to allow client connections
  // - Keep list of active users with username

  static MAX_SESSION_LENGTH = 1000 * 60 * 3; // 3 minutes

  constructor(demoApp) {
    super(KioskCustom.MAX_SESSION_LENGTH);
  }

  // overrides for debugging notifications ------------

  buildQrCode() {
    // override to append handshake ID to querystring
    // uses ShortUniqueId module
    this.uid = !this.uid ? new ShortUniqueId() : this.uid;
    this.qrId = this.uid();
    super.buildQrCode(`&qrId=${this.qrId}`);
  }

  // do handshake with client

  peerDataReceived(data) {
    super.peerDataReceived(data);

    // get sender connection object
    let senderPeerID = data.sender;
    let conn = this.connections.find((c) => c.peer == senderPeerID);

    // check handshake message
    if (data.cmd === "handshake") {
      if (this.qrId == data.qrId) {
        // qrID matches one-time QR code! handshake is good
        this.sendJSON({ cmd: "handshakeSuccess" }, conn);
        this.emit("handshakeSuccess", conn);
        this.buildQrCode(this.qrContainer);
      } else {
        this.emit("handshakeFailure", conn);
        conn.close(); // will be cleaned up by manageConnections()
      }
    }

    // check for name
    if (data.cmd === "username") {
      conn.username = data.name;
      this.manageConnections();
    }
  }

  manageConnections() {
    super.manageConnections();
    this.emit("usernames", this.getUsernameList());
  }

  getUsernameList() {
    return this.connections.map((c) => c.username);
  }
}

class ClientCustom extends WebRtcClient {
  // Custom client features:
  // - Send username
  // - Disconnect if handshake fails (based on qrId)
  // - Advance if handshake is successful

  constructor() {
    super(URLUtil.getHashQueryVariable("offer"));
    this.qrId = URLUtil.getHashQueryVariable("qrId");
  }

  peerConnected() {
    // on connection, send handshake request
    this.sendJSON({ cmd: "handshake", qrId: this.qrId });
  }
}

if (window.autoInitDemo) window.demo = new WebRtcKioskDemo(document.body);
