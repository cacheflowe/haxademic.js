import DemoBase from "./demo--base.es6.js";
import AppStoreDebug from "../src/app-store-debug.es6.js";
import AppStoreDistributed from "../src/app-store-distributed.es6.js";
import EventLog from "../src/event-log.es6.js";
import PointerPos from "../src/pointer-pos.es6.js";
import URLUtil from "../src/url-util.es6.js";

class AppStoreDistributedDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "AppStoreDistributed",
      "app-store-distributed-container"
    );
  }

  init() {
    // add inline logging
    this.log = new EventLog(document.getElementById("debug"));

    // get address from querystring
    let serverAddr =
      URLUtil.getHashQueryVariable("server") || "ws://localhost:3001";
    this.log.log(`attempting to connect to ${serverAddr}`);

    // init AppStore
    this.appStoreDistributed = new AppStoreDistributed(serverAddr);
    this.appStoreDistributed.addListener(this);
    // save state across sessions.
    // also exclude "KEY_SHARED" from triggering a localStorage save, for example
    this.appStoreDistributed.initLocalStorage(["KEY_SHARED"]);
    // if we want to check if messages were from ourselves, call the following method, along with _store.senderIsSelf() in storeUpdated()
    console.log(this.appStoreDistributed.initSenderID());
    // optional debug window
    this.appStoreDebug = new AppStoreDebug(true);

    // Add Pointerpos for mouse position
    this.pointerPos = new PointerPos((e, x, y) => {
      this.appStoreDistributed.set("MOUSE_X", x, true);
      this.appStoreDistributed.set("MOUSE_Y", y, true);
    });
  }

  keyDown(key) {
    this.log.log(`key pressed: ${key}`);
    this.appStoreDistributed.set("KEY_SHARED", key, true);
  }

  storeUpdated(key, value) {
    if (_store.senderIsSelf()) return;
    this.log.log(`storeUpdated: ${key} = ${value}`);
  }
}

if (window.autoInitDemo)
  window.demo = new AppStoreDistributedDemo(document.body);
