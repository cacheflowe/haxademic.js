import DemoBase from "./demo--base.es6.js";
import EventLog from "../src/event-log.es6.js";
import MobileUtil from "../src/mobile-util.es6.js";
import PointerPos from "../src/pointer-pos.es6.js";
import SolidSocket from "../src/solid-socket.es6.js";
import URLUtil from "../src/url-util.es6.js";

class SolidSocketDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "SolidSocket",
      "solid-socket",
      "Run /server/ws-relay.mjs and add your socket server address to the URL as a hash: #server=ws://192.168.1.171:3001/ws"
    );
  }

  init() {
    this.injectCSS(`
      #results {
        pointer-events: none;
      }
      .has-socket h1 {
        color: #00ff00;
      }
      .no-socket h1 {
        color: #ff0000;
      }
    `);
    this.injectHTML(`
      <div>
        <button id="button1">Button 1</button>
        <button id="button2">Button 2</button>
        <button id="button3">startRun</button>
        <button id="button4">redoRun</button>
        <button id="button5">saveUserData</button>
        <button id="button6">reset</button>
      </div>
    `);
    this.log = new EventLog(this.debugEl);
    this.pointerPos = new PointerPos(this.pointerMoved.bind(this));
    this.initSocket();
    this.addClicks();
    // MobileUtil.lockTouchScreen(true);
  }

  addClicks() {
    this.el = document.querySelector(".container");
    this.el.addEventListener("click", (e) => {
      if (e.target.id == "button1") this.solidSocket.sendJSON({ button: 1 });
      if (e.target.id == "button2") this.solidSocket.sendJSON({ button: 2 });
      if (e.target.id == "button3")
        this.solidSocket.sendJSON({ cmd: "startRun" });
      if (e.target.id == "button4")
        this.solidSocket.sendJSON({ cmd: "redoRun" });
      if (e.target.id == "button5")
        this.solidSocket.sendJSON({
          cmd: "saveUserData",
          userName: "SALLY",
          userNumber: "23",
          userId: "1111-2222-3333-4444",
        });
      if (e.target.id == "button6") this.solidSocket.sendJSON({ cmd: "reset" });
    });
    document.body.addEventListener("click", (e) => {
      this.solidSocket.sendJSON({
        pointerX: this.pointerPos.xNorm(),
        pointerY: this.pointerPos.yNorm(),
        click: true,
      });
    });
  }

  // POINTER

  pointerMoved(x, y) {
    this.solidSocket.sendJSON({
      pointerX: this.pointerPos.xNorm(),
      pointerY: this.pointerPos.yNorm(),
    });
  }

  // SOCKET

  initSocket() {
    // get address from querystring
    let serverAddr =
      URLUtil.getHashQueryVariable("server") || "ws://192.168.1.171:3001";
    this.log.log(`attempting to connect to ${serverAddr}`);

    // this.solidSocket = new SolidSocket(`${serverAddr}?roomId=987654321`);
    this.solidSocket = new SolidSocket(`${serverAddr}`);
    this.solidSocket.setOpenCallback(this.onOpen.bind(this));
    this.solidSocket.setMessageCallback(this.onMessage.bind(this));
    this.solidSocket.setErrorCallback(this.onError.bind(this));
    this.solidSocket.setCloseCallback(this.onClose.bind(this));
  }

  onOpen(e) {
    this.log.log("SolidSocket.onOpen()", "#55ff55");
    this.solidSocket.sendJSON({ hello: "connect!" });
  }

  onMessage(msg) {
    this.log.log(msg.data);
  }

  onError(e) {
    this.log.log(
      `SolidSocket.onError() ${e.message ? ": " + e.message : ""}`,
      "#ff5555"
    );
    console.log("onError", e);
  }

  onClose(e) {
    this.log.log("SolidSocket.onClose()", "#ff5555");
    console.log("onClose", e);
  }
}

if (window.autoInitDemo) window.demo = new SolidSocketDemo(document.body);
