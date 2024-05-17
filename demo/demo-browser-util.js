import DemoBase from "./demo--base.js";
import BrowserUtil from "../src/browser-util.js";

class BrowserUtilDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "BrowserUtil",
      "browser-util-demo",
      'Press "f" to toggle fullscreen, "s" to enable wake lock, and "d" to exit wake lock.'
    );
  }

  init() {}

  keyDown(key) {
    if (key == "f") {
      this.toggleFullScreen();
    }
    if (key == "s") {
      BrowserUtil.enableWakeLock();
    }
    if (key == "d") {
      BrowserUtil.disableWakeLock();
    }
  }

  toggleFullScreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }
}

if (window.autoInitDemo) window.demo = new BrowserUtilDemo(document.body);
