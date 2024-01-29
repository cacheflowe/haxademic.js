import DemoBase from "./demo--base.js";
import URLUtil from "../src/url-util.js";
import { WebRtcClient, WebRtcKiosk } from "../src/webrtc-peer.js";
import ShortUniqueId from "../vendor/short-unique-id.min.js";

class WebRtcGroupGameDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "WebRTC | Group Game",
      "webrtc-container",
      "Scane the QR code to be assigned a game group, and then enter your name to join."
    );
  }

  init() {
    URLUtil.reloadOnHashChange(); // helps w/pasting the offer link from kiosk tab
    this.addNotyf();
    let offer = URLUtil.getHashQueryVariable("offer");
    if (offer) {
      this.buildClientUI();
      this.buildClient(offer);
    } else {
      this.buildKioskUI();
      this.buildKiosk();
    }
  }

  buildKioskUI() {
    // inject form html
    this.el.innerHTML = `
      <div>
        <qr-code>Waiting for PeerJS connection...</qr-code>
      </div>
      <button id="game-start">Start Game</button>
      <button id="game-end">End Game</button>
      <button id="close-connections">Close Connections</button>
    `;
    // create container for QR code to update
    this.qrContainer = this.el.querySelector("qr-code");
    // kill connections button
    this.closeButton = this.el.querySelector("#close-connections");
    this.closeButton.addEventListener("click", () => {
      this.kiosk.closeAllConnections();
      this.newQrSession();
    });
    // start game button
    this.startButton = this.el.querySelector("#game-start");
    this.startButton.addEventListener("click", () => {
      this.kiosk.broadcastJSON({ cmd: "gameStart" });
    });
    // end game button
    this.endButton = this.el.querySelector("#game-end");
    this.endButton.addEventListener("click", () => {
      this.kiosk.broadcastJSON({ cmd: "gameEnd" });
    });
  }

  newUserColor() {
    // lazy-init colors
    if (!this.userColors) {
      this.colorIndex = -1;
      this.userColors = ["#f00", "#0f0", "#00f", "#ff0", "#f0f", "#0ff"];
    }

    // cycle through colors
    this.colorIndex++;
    this.colorIndex = this.colorIndex % this.userColors.length;

    // return next color
    return this.userColors[this.colorIndex];
  }

  newQrSession() {
    this.qrId = new ShortUniqueId()(); // append handshake ID to querystring - uses ShortUniqueId module
    this.kiosk.buildQrCode(`&qrId=${this.qrId}`);
  }

  buildKiosk() {
    // Kiosk features:
    // - Advertise the kiosk connection via QR code & allow multiple connections
    // - Disconnect clients from server after 10 minutes
    // - Handshake to init client connections with a `qrId` hash querystring, used only for the current game session
    // - Keep list of active users with username, color and score
    // - Broadcast data to all clients
    // - Send data to specific client
    // - Disconnect all and regenerate QR code with new QR id while preserving original peerID for persistent connection

    const MAX_SESSION_LENGTH = 1000 * 60 * 10; // 10 minutes
    this.kiosk = new WebRtcKiosk(MAX_SESSION_LENGTH, new ShortUniqueId()());
    this.kiosk.setQrOptions({
      color: {
        dark: "#000",
        light: "#bfb",
      },
    });
    this.kiosk.addListener("serverConnected", (data) => {
      _notyfSuccess("serverConnected!");
      setTimeout(() => {
        // kick off QR code generation with qrId for single-session authentication handshake
        this.newQrSession();
      }, 200);
    });
    this.kiosk.addListener("serverDisconnected", (data) => {
      _notyfError("serverDisconnected!");
    });
    this.kiosk.addListener("qrCode", (qrEl) => {
      this.qrContainer.innerHTML = "";
      this.qrContainer.appendChild(qrEl);
      _notyfSuccess("QR code generated");
    });
    this.kiosk.addListener("handshakeSuccess", (conn) => {
      _notyfSuccess("Client Connected!");
    });
    this.kiosk.addListener("peerDataReceived", (data) => {
      console.log("peerDataReceived", data);

      // get sender connection object
      let senderPeerID = data.sender;
      let connections = this.kiosk.connections;
      let clientConn = connections.find((c) => c.peer == senderPeerID);

      // check handshake message and send data only to new client
      if (data.cmd === "handshake") {
        if (this.qrId == data.qrId) {
          let userColor = this.newUserColor();
          let handshakeData = { cmd: "handshakeSuccess", color: userColor };
          clientConn.color = userColor;
          clientConn.score = 0;
          this.kiosk.sendJSON(handshakeData, clientConn);
          console.log("handshakeSuccess sent to", clientConn);
        } else {
          this.emit("handshakeFailure", conn);
          conn.close(); // will be cleaned up by manageConnections()
        }
      }

      // check for name and add as custom property on PeerJS connection object (which is maybe a little suspect)
      // but use this opportunity to force update the UI with the current connections
      if (data.cmd === "username") {
        clientConn.username = data.name;
        this.kiosk.manageConnections();
      }

      // add score
      if (data.cmd === "score") {
        clientConn.score++;
        this.kiosk.manageConnections();
      }
    });
    this.kiosk.addListener("connections", (connections) => {
      // show user info for debugging
      const userInfo = (c) => {
        return `
          <hr>
          <blockquote>
            Username: ${c.username || "none"}<br>
            Color: <span style="color:${c.color}">${c.color}</span><br>
            Score: ${c.score}<br>
            PeerID: ${c.peer}<br>
          </blockquote>
        `;
      };
      // display server & connections info
      let users = connections.map((c) => userInfo(c)).join(", ");
      this.debugEl.innerHTML = `
        <div>isServerConnected: ${this.kiosk.isServerConnected()}</div>
        <div>Connections: ${connections.length}</div>
        <div>
          <h4>Users:</h4>
          ${users}
        </div>
      `;
    });
  }

  buildClientUI() {
    this.el.innerHTML = `
      <div>
        <qr-code>Waiting for PeerJS connection...</qr-code>
      </div>
    `;
  }

  buildClient(offer) {
    this.client = new WebRtcClient(offer);
    this.client.addListener("peerConnected", (data) => {
      // on connection, send handshake request sendJSON() from client only sends to kiosk
      // try a slight delay since we're just getting connected to the kiosk
      setTimeout(() => {
        let qrId = URLUtil.getHashQueryVariable("qrId");
        this.client.sendJSON({ cmd: "handshake", qrId: qrId });
      }, 200);
    });
    this.client.addListener("peerDataReceived", (data) => {
      console.log("peerDataReceived", data);
      if (data.cmd == "handshakeSuccess") {
        console.log("Connection success! Show UI...");
        this.addTextInput(data);
      }
      if (data.cmd == "gameStart") {
        _notyfSuccess("Game started!");
      }
      if (data.cmd == "gameEnd") {
        _notyfSuccess("Game ended!");
      }
    });
    this.client.addListener("serverDisconnected", (data) => {
      _notyfError("serverDisconnected!");
      this.showEndScreen();
    });
    this.client.addListener("peerClose", (data) => {
      _notyfError("peerClose!");
      this.showEndScreen();
    });
    this.client.addListener("serverError", (data) => {
      _notyfError("serverError!");
      this.showTryAgain();
    });
  }

  addTextInput(data) {
    // inject form html
    this.el.innerHTML = `
      <div>Connected to kiosk!</div>
      <div>Here's your color:</div>
      <div id="user-color"></div>
      <div>Enter your name:</div>
      <input id="name" type="text" />
      <button id="submit">Submit</button>
      <div>
        <button id="score">Score +1</button>
      </div>
    `;

    // add user color display
    let colorBlock = this.el.querySelector("#user-color");
    colorBlock.style.backgroundColor = data.color;
    colorBlock.style.width = "200px";
    colorBlock.style.height = "60px";

    // name submit form
    this.el.querySelector("#submit").addEventListener("click", () => {
      let name = document.getElementById("name").value;
      this.client.sendJSON({ cmd: "username", name: name });
    });

    // score button
    this.el.querySelector("#score").addEventListener("click", () => {
      this.client.sendJSON({ cmd: "score" });
    });
  }

  showEndScreen() {
    // inject form html
    this.el.innerHTML = `
      <h2>Done!</h2>
    `;
  }

  showTryAgain() {
    // inject form html
    this.el.innerHTML = `
      <h2>Couldn't connect, scan QR code again!</h2>
    `;
  }
}

if (window.autoInitDemo) window.demo = new WebRtcGroupGameDemo(document.body);
