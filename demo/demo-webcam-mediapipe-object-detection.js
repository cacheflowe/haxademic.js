import DemoBase from "./demo--base.js";
import Webcam from "../src/webcam.js";
import {
  ObjectDetector,
  FilesetResolver,
} from "../vendor/mediapipe/tasks-vision@0.10.2.js"; // "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2"

// TODO:
// - Add custom data
// - Add QR code with link to image that you can try out by showing your phone to the webcam

class WebcamMediaPipeObjectDetectionDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "Webcam | MediaPipe Object Detection",
      "mediapipe-container",
      "MediaPipe Object Detection"
    );
  }

  init() {
    this.modelURL = `../data/machine-learning/mediapipe-waffle-model.tflite`; // `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite`;
    this.visionURL = `../vendor/mediapipe/wasm`; //  `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm`;
    this.addCSS();
    this.addOverlayContainer();
    this.addStartButton();
  }

  addCSS() {
    super.injectCSS(`
      .overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }
      .overlay p {
        position: absolute;
        padding-bottom: 5px;
        padding-top: 5px;
        background-color: #007f8b;
        color: #fff;
        border: 1px dashed rgba(255, 255, 255, 0.7);
        z-index: 2;
        font-size: 12px;
        margin: 0;
      }
      .overlay .highlighter {
        background: rgba(0, 255, 0, 0.25);
        border: 1px dashed #fff;
        z-index: 1;
        position: absolute;
      }
    `);
  }

  addStartButton() {
    this.startButton = document.createElement("button");
    this.startButton.innerText = "Start";
    this.el.appendChild(this.startButton);

    // click video to load webcam
    this.startButton.addEventListener("click", (e) => {
      this.startButton.parentNode.removeChild(this.startButton);

      // init webcam
      this.webcam = new Webcam(
        (videoEl) => {
          this.videoEl = videoEl;
          this.el.appendChild(videoEl);
          this.mirrored = false;
          this.loadMediapipe();
        },
        (error) => {
          this.el.innerHTML = "[Webcam ERROR] :: " + error;
        },
        true
      );
    });
  }

  addOverlayContainer() {
    this.el.style.position = "relative";
    this.boundingBoxes = document.createElement("div");
    this.boundingBoxes.classList.add("overlay");
    this.el.appendChild(this.boundingBoxes);
  }

  async loadMediapipe() {
    this.runningMode = "VIDEO";
    this.lastVideoTime = -1;
    this.children = [];
    const vision = await FilesetResolver.forVisionTasks(this.visionURL);
    this.objectDetector = await ObjectDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: this.modelURL,
        delegate: "GPU",
      },
      scoreThreshold: 0.5,
      runningMode: this.runningMode,
    });
    requestAnimationFrame(() => this.predictWebcam());
  }

  async predictWebcam() {
    let startTimeMs = performance.now();

    // Detect objects using detectForVideo.
    if (this.videoEl.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.videoEl.currentTime;
      const detections = this.objectDetector.detectForVideo(
        this.videoEl,
        startTimeMs
      );
      this.displayVideoDetections(detections);
    }

    // Call this function again to keep predicting when the browser is ready.
    requestAnimationFrame(() => this.predictWebcam());
  }

  displayVideoDetections(result) {
    // Remove any highlighting from previous frame.
    this.boundingBoxes.innerHTML = "";

    // Iterate through predictions and draw them to the live view
    for (let detection of result.detections) {
      const score = detection.categories[0].score;
      if (score > 0.5) {
        const confidence = Math.round(parseFloat(score) * 100);
        const p = document.createElement("p");
        p.innerText = ` ${detection.categories[0].categoryName}  - with ${confidence}% confidence`;

        let w = detection.boundingBox.width - 10;
        let h = detection.boundingBox.height;
        let x = detection.boundingBox.originX;
        let y = detection.boundingBox.originY;
        if (this.mirrored) {
          x = this.videoEl.offsetWidth - detection.boundingBox.width - x;
        }
        p.style = `left: ${x}px; top: ${y}px; width: ${w}px;`;

        const highlighter = document.createElement("div");
        highlighter.setAttribute("class", "highlighter");
        highlighter.style = `left: ${x}px; top: ${y}px; width: ${w}px; height: ${h}px;`;

        this.boundingBoxes.appendChild(highlighter);
        this.boundingBoxes.appendChild(p);
      }
    }
  }
}

if (window.autoInitDemo)
  window.demo = new WebcamMediaPipeObjectDetectionDemo(document.body);
