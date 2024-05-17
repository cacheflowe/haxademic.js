import DemoBase from "./demo--base.js";
import BrowserUtil from "../src/browser-util.js";

class BrowserUtilDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "BrowserUtil",
      "browser-util-demo",
      `
        Press "f" to toggle fullscreen<br>
        "w" to toggle wake lock<br>
        "s" to enable wake lock,<br>
        and "d" to exit wake lock.
      `
    );
  }

  init() {
    this.updateStatus();
  }

  keyDown(key) {
    if (key == "f") {
      BrowserUtil.toggleFullscreen();
    }
    if (key == "w") {
      BrowserUtil.toggleWakeLock();
    }
    if (key == "s") {
      BrowserUtil.enableWakeLock();
    }
    if (key == "d") {
      BrowserUtil.disableWakeLock();
    }
    setTimeout(() => this.updateStatus(), 100);
  }

  updateStatus() {
    this.debugEl.innerHTML = `
      <div>isFullscreen: <code>${BrowserUtil.isFullscreen()}</code></div>
      <div>isWakeLocked: <code>${BrowserUtil.isWakeLocked()}</code></div>
    `;
  }
}

if (window.autoInitDemo) window.demo = new BrowserUtilDemo(document.body);
