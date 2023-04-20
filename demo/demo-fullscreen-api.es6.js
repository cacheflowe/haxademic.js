import DemoBase from "./demo--base.es6.js";

class FullScreenAPIDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "Fullscreen API",
      "fullscreen-api-demo",
      'Press "f" to toggle fullscreen.'
    );
  }

  init() {}

  keyDown(key) {
    if (key == "f") {
      this.toggleFullScreen();
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

if (window.autoInitDemo) window.demo = new FullScreenAPIDemo(document.body);
