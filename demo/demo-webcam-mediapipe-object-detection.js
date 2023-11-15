import DemoBase from "./demo--base.js";
import FloatBuffer from "../src/float-buffer.js";
import EasingFloat from "../src/easing-float.js";
import Webcam from "../src/webcam.js";
import {
  ObjectDetector,
  FilesetResolver,
} from "../vendor/mediapipe/tasks-vision@0.10.2.js"; // "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2"

// Links:
// - https://developers.google.com/mediapipe/api/solutions/js/tasks-vision.objectdetector
// TODO:
// - Progress for requisite downloads: https://javascript.info/fetch-progress
// - Confidence FloatBuffer might need to be a lerp with deltaTime to be correct across framerates

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
    this.addNotyf();
    this.modelURL = `../data/machine-learning/mediapipe-waffle-model_fp16.tflite`; // `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite`;
    this.visionURL = `../vendor/mediapipe/wasm`; //  `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm`;
    this.webcamSample = `../data/videos/sample-webcam.mp4`;
    this.addCSS();
    if (this.webcamSample) {
      this.addWebcamSample();
    } else {
      this.addWebcamStartButton();
    }
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
        background: rgba(0, 255, 0, 0.35);
        border: 3px solid #fff;
        z-index: 1;
        position: absolute;
      }
      .video-source {
        max-width: 100%;
      }
    `);
  }

  addWebcamStartButton() {
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
          this.videoEl.classList.add("video-source");
          this.mirrored = false;
          this.loadMediapipe();
        },
        (error) => {
          this.el.innerHTML = "[Webcam ERROR] :: " + error;
        },
        Webcam.backFacingOptions()
      );
    });
  }

  addWebcamSample() {
    this.videoEl = document.createElement("video");
    this.videoEl.src = this.webcamSample;
    this.videoEl.setAttribute("autoplay", true);
    this.videoEl.setAttribute("playsinline", true);
    this.videoEl.setAttribute("loop", true);
    this.videoEl.setAttribute("muted", true);
    this.videoEl.setAttribute("controls", true);
    this.videoEl.classList.add("video-source");
    this.loadMediapipe();
  }

  async loadMediapipe() {
    this.runningMode = "VIDEO";
    this.confidenceFloor = 0.7;
    this.lastVideoTime = -1;
    this.children = [];
    const vision = await FilesetResolver.forVisionTasks(this.visionURL);
    this.objectDetector = await ObjectDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: this.modelURL,
        delegate: "GPU",
      },
      scoreThreshold: this.confidenceFloor,
      runningMode: this.runningMode,
    });

    this.rectangle = new Rectangle(this.el, this.videoEl, this.debugEl);
    this.predictWebcam();
  }

  async predictWebcam() {
    let startTimeMs = performance.now();

    // Detect objects using detectForVideo.
    if (this.videoEl.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.videoEl.currentTime;
      const detections = await this.objectDetector.detectForVideo(
        this.rectangle.canvas, // this.videoEl,
        startTimeMs
      );
      this.processVideoDetections(detections);
    }
    requestAnimationFrame(() => this.predictWebcam());
  }

  processVideoDetections(result) {
    // Iterate through predictions
    // TODO: Make sure we use only the best prediction!
    let goodResults = 0;
    for (let detection of result.detections) {
      const score = detection.categories[0].score;
      if (score > this.confidenceFloor) {
        goodResults++;
        let w = detection.boundingBox.width - 10;
        let h = detection.boundingBox.height;
        let x = detection.boundingBox.originX;
        let y = detection.boundingBox.originY;
        if (this.mirrored) {
          x = this.videoEl.offsetWidth - detection.boundingBox.width - x;
        }

        // update target bounding box
        this.rectangle.setTargetSize(x + w / 2, y + h / 2, w, h);
        this.rectangle.setTargetConfidence(score);
      }
    }

    // reset values if no detections
    if (goodResults == 0) {
      this.rectangle.setTargetConfidence(0);
    }
  }
}

class Rectangle {
  constructor(container, videoEl, debugEl) {
    this.reset(0, 0, 0, 0);
    this.container = container;
    this.videoEl = videoEl;
    this.debugEl = debugEl;
    this.confidenceSmoothed = new FloatBuffer(30);
    this.initDeltaTime();
    this.initPerformance();
    this.initDetectionConfirm();
    this.initMainCanvas();
    this.initSnapshotCanvas();
    this.animate();
  }

  initMainCanvas() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 800;
    this.canvas.height = 800;
    this.canvas.classList.add("video-source");
    this.ctx = this.canvas.getContext("2d");
    this.container.appendChild(this.canvas);

    // add anim props
    this.scanProgress = 0;

    // video wouldn't play without inserting into DOM??!
    this.container.appendChild(this.videoEl);
    this.videoEl.setAttribute("style", "height:1px; opacity: 0;");
  }

  initSnapshotCanvas() {
    this.canvasSnap = document.createElement("canvas");
    this.canvasSnap.width = 128;
    this.canvasSnap.height = 128;
    this.ctxSnap = this.canvasSnap.getContext("2d");
    this.container.appendChild(this.canvasSnap);
  }

  curTime() {
    return new Date().getTime();
  }

  initDeltaTime() {
    this.timeLast = this.curTime();
    this.deltaTime = 0;
  }

  initPerformance() {
    this.secondsTracker = 0;
    this.fpsAnim = 0;
    this.framesAnim = 0;
    this.fpsDetect = 0;
    this.framesDetect = 0;
  }

  updatePerformance() {
    if (this.curTime() > this.secondsTracker + 1000) {
      this.secondsTracker = this.curTime();
      this.fpsAnim = this.framesAnim;
      this.fpsDetect = this.framesDetect;
      this.framesAnim = 0;
      this.framesDetect = 0;
    }
  }

  updateDeltaTime() {
    const now = this.curTime();
    this.deltaTime = (now - this.timeLast) / 1000;
    this.timeLast = now;
  }

  reset(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.xTarget = x;
    this.yTarget = y;
    this.wTarget = w;
    this.hTarget = h;
    this.lerpAmp = 1;
  }

  setTargetConfidence(score) {
    if (this.isDetectTimeout()) score = 0;
    this.confidenceSmoothed.update(score);
    this.framesDetect++;
  }

  setTargetSize(x, y, w, h) {
    this.xTarget = x;
    this.yTarget = y;
    this.wTarget = w;
    this.hTarget = h;
  }

  initDetectionConfirm() {
    this.resultProgress = 0;
    this.confidenceDetect = 0.85;
    this.detectTime = this.curTime();
  }

  updateDetectionCheck() {
    if (this.confidenceSmoothed.average() > this.confidenceDetect) {
      this.resultProgress += this.deltaTime * 0.5;
    } else {
      this.resultProgress -= this.deltaTime * 2;
    }
    // keep in bounds
    this.resultProgress = Math.max(0, Math.min(1, this.resultProgress));
    // if confirmed, let's detect!
    if (this.resultProgress >= 1) {
      this.detected();
    }
  }

  isDetectTimeout() {
    return this.curTime() - this.detectTime < 2000;
  }

  detected() {
    if (this.isDetectTimeout()) return;
    this.resultProgress = 0;
    this.detectTime = this.curTime();
    this.drawVideoFrame(this.ctxSnap);
    _notyfSuccess("Detected!");
  }

  lerp(a, b, alpha) {
    return a + alpha * (b - a);
  }

  animate() {
    this.updateDeltaTime();
    this.updatePerformance();
    this.updateDetectionCheck();
    this.lerpAmp = this.deltaTime * 10;
    this.x = this.lerp(this.x, this.xTarget, this.lerpAmp);
    this.y = this.lerp(this.y, this.yTarget, this.lerpAmp);
    this.w = this.lerp(this.w, this.wTarget, this.lerpAmp);
    this.h = this.lerp(this.h, this.hTarget, this.lerpAmp);
    this.drawVideoFrame(this.ctx);
    this.drawScanLine();
    this.drawReticle();
    this.drawBoundingBox();
    this.printDebugText();
    this.framesAnim++;
    requestAnimationFrame(() => this.animate());
  }

  drawVideoFrame(ctx) {
    // crop/fill algorithm
    let cropFill = true;
    let containerW = ctx.canvas.width;
    let containerH = ctx.canvas.height;
    let imageW = this.videoEl.videoWidth;
    let imageH = this.videoEl.videoHeight;
    var ratioW = ctx.canvas.width / imageW;
    var ratioH = ctx.canvas.height / imageH;
    var shorterRatio = ratioW > ratioH ? ratioH : ratioW;
    var longerRatio = ratioW > ratioH ? ratioW : ratioH;
    var resizedW = cropFill
      ? Math.ceil(imageW * longerRatio)
      : Math.ceil(imageW * shorterRatio);
    var resizedH = cropFill
      ? Math.ceil(imageH * longerRatio)
      : Math.ceil(imageH * shorterRatio);
    var offsetX = Math.ceil((containerW - resizedW) * 0.5);
    var offsetY = Math.ceil((containerH - resizedH) * 0.5);

    // draw cropped video frame
    ctx.drawImage(this.videoEl, offsetX, offsetY, resizedW, resizedH);
  }

  drawBoundingBox() {
    if (this.confidenceSmoothed.average() > 0.35 && !this.isDetectTimeout()) {
      let size = Math.min(this.w, this.h);
      if (size < 0.1) size = 0.001; // odd negative size can crash canvas code

      // draw bounding circle canvas
      this.ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
      this.ctx.shadowBlur = 15;

      this.ctx.beginPath();
      this.ctx.arc(this.x, this.y, size / 2, 0, 2 * Math.PI, false);
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
      this.ctx.fill();
      this.ctx.lineWidth = 15;
      this.ctx.strokeStyle = "rgba(255, 255, 255, 1)";
      this.ctx.stroke();

      // draw progress bar
      this.ctx.shadowBlur = 0;

      let rads = 2 * Math.PI * this.resultProgress;
      this.ctx.beginPath();
      this.ctx.arc(this.x, this.y, size / 2, 0, rads, false);
      this.ctx.lineWidth = 15;
      this.ctx.strokeStyle = "#16216a";
      this.ctx.stroke();
    }
  }

  drawReticle() {
    let cw = this.canvas.width;
    let ch = this.canvas.height;
    this.ctx.fillStyle = "#ffffff";

    this.ctx.fillRect(80, 80, 4, 100);
    this.ctx.fillRect(60, 100, 80, 4);

    this.ctx.fillRect(cw - 80, ch - 80, -4, -100);
    this.ctx.fillRect(cw - 60, ch - 100, -80, -4);
  }

  drawScanLine() {
    let cw = this.canvas.width;
    let ch = this.canvas.height;

    this.scanProgress += this.deltaTime * 0.5;
    if (this.scanProgress > 0.98) this.scanProgress = 0;
    this.ctx.fillStyle = "#16216a";
    this.ctx.fillRect(80, 100 + (ch - 200) * this.scanProgress, cw - 160, 8);
  }

  printDebugText() {
    this.debugEl.innerHTML = `
      <code>
        <b>Time</b><br>
        deltaTime: ${this.deltaTime}<br>
        lerpAmp: ${this.lerpAmp}<br>
        fpsAnim: ${this.fpsAnim}<br>
        fpsDetect: ${this.fpsDetect}<br>
        <b>Detection</b><br>
        Confidence: ${this.confidenceSmoothed.average().toFixed(2)}<br>
        resultProgress: ${this.resultProgress.toFixed(2)}<br>
      </code>
    `;
  }
}

if (window.autoInitDemo)
  window.demo = new WebcamMediaPipeObjectDetectionDemo(document.body);
