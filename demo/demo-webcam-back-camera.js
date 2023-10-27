import DemoBase from "./demo--base.js";
import Webcam from "../src/webcam.js";

class WebcamDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "Webcam",
      "webcam-container",
      "A wrapper for the webcam API, showing the back camera option in this demo"
    );
  }

  init() {
    // add button to start everything
    this.startButton = document.createElement("button");
    this.startButton.innerText = "Start";
    this.el.appendChild(this.startButton);

    // click video to load webcam
    this.startButton.addEventListener("click", (e) => {
      this.startButton.parentNode.removeChild(this.startButton);

      // init webcam
      this.webcam = new Webcam(
        (videoEl) => {
          this.el.appendChild(videoEl);
        },
        (error) => {
          this.el.innerHTML = "[Webcam ERROR] :: " + error;
        },
        true
      );
    });
  }
}

if (window.autoInitDemo) window.demo = new WebcamDemo(document.body);
