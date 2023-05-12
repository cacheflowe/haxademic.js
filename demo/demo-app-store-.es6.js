import DemoBase from "./demo--base.es6.js";
import AppStoreDebug from "../src/app-store-debug.es6.js";
import AppStore from "../src/app-store-.es6.js";
import EventLog from "../src/event-log.es6.js";
import PointerPos from "../src/pointer-pos.es6.js";

class AppStoreDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "AppStore",
      "app-store-container",
      "Use the <code>/</code> key to toggle the AppStoreDebug view. Move your mouse or press a key to set values on the store."
    );
  }

  init() {
    // add inline logging
    this.log = new EventLog(this.debugEl, 10);

    // init AppStore
    this.appStore = new AppStore();
    this.appStoreDebug = new AppStoreDebug(true);
    this.appStore.addListener(this);
    // save state across sessions.
    // also exclude "KEY_SHARED" from triggering a localStorage save, for example
    this.appStore.initLocalStorage(["KEY_SHARED"]);
    // optional debug window

    // Add Pointerpos for mouse position
    this.pointerPos = new PointerPos((e, x, y) => {
      this.appStore.set("MOUSE_X", x, true);
      this.appStore.set("MOUSE_Y", y, true);
    });
  }

  keyDown(key) {
    this.appStore.set("KEY_SHARED", key, true);
  }

  storeUpdated(key, value) {
    this.log.log(`storeUpdated: ${key} = ${value}`);
    this.el.innerHTML = `Store data:<br><pre>${this.appStore.toString()}</pre>`;
  }
}

if (window.autoInitDemo) window.demo = new AppStoreDemo(document.body);
