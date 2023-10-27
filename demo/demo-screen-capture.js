import DemoBase from "./demo--base.js";
import ScreenCapture from "../src/screen-capture.js";

class ScreenCaptureDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "ScreenCapture",
      "screen-cap-container",
      "Uses getDisplayMedia() to screenshare, much like getUserMedia for webcam access. Desktop only."
    );
  }

  init() {
    // init ScreenCapture
    this.ScreenCapture = new ScreenCapture(
      (videoEl) => {
        // attach to DOM, fit to container
        videoEl.style.width = "100%";
        this.el.appendChild(videoEl);
      },
      (error) => {
        this.el.innerHTML = "[ScreenCapture ERROR] :: " + error;
      }
    );
  }
}

if (window.autoInitDemo) window.demo = new ScreenCaptureDemo(document.body);
