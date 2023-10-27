import DemoBase from "./demo--base.js";
import AppStoreDebug from "../src/app-store-debug.js";
import AppStoreBroadcastChannel from "../src/app-store-broadcast-channel.js";
import EventLog from "../src/event-log.js";
import PointerPos from "../src/pointer-pos.js";

class AppStoreBroadcastChannelDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "AppStoreBroadcastChannel",
      "app-store-broadcast-channel-container",
      "Open this demo in multiple windows of the same browser to show off the cross-tab/window communication."
    );
  }

  init() {
    // init AppStore
    this.appStoreBroadcastChannel = new AppStoreBroadcastChannel(
      "sharedChannelDemo"
    );
    this.appStoreBroadcastChannel.addListener(this);
    this.appStoreDebug = new AppStoreDebug(true);

    // add inline logging
    this.log = new EventLog(document.getElementById("debug"));
    this.log.log(`attempting to connect to BroadcastChannel`);

    // Add Pointerpos for mouse position
    this.pointerPos = new PointerPos((e, x, y) => {
      this.appStoreBroadcastChannel.set("MOUSE_X", x, true);
      this.appStoreBroadcastChannel.set("MOUSE_Y", y, true);
    });
  }

  keyDown(key) {
    this.log.log(`key pressed: ${key}`);
    this.appStoreBroadcastChannel.set("KEY_SHARED", key, true);
  }

  storeUpdated(key, value) {
    this.log.log(`storeUpdated: ${key} = ${value}`);
  }
}

if (window.autoInitDemo)
  window.demo = new AppStoreBroadcastChannelDemo(document.body);
