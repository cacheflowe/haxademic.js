import DemoBase from "./demo--base.js";
import DOMUtil from "../src/dom-util.js";
import EventLog from "../src/event-log.js";
import ImageUtil from "../src/image-util.js";
import FrameLoop from "../src/frame-loop.js";
import Webcam from "../src/webcam.js";
import Stats from "../vendor/stats.module.js";

// NOTES
// - https://editor.p5js.org/ml5/sketches/c8sl_hGmN
// - https://github.com/ml5js/ml5-next-gen/blob/main/src/Bodypose/index.js
// - https://github.com/ml5js/ml5-library/issues/478 - loading models offline
// - https://www.kaggle.com/models/google/movenet
// - https://www.kaggle.com/models/google/movenet/frameworks/tfJs - download model here
// - https://www.tensorflow.org/lite/examples/pose_estimation/overview - model landmark points explanation
// - https://github.com/tensorflow/tfjs-models/blob/master/pose-detection/src/movenet/README.md

// TODO
// - Try shrinking the image into a <canvas> to speed up detection
//   - Why is it so much slower with the webcam?
// - Track skeletons over time by checking distance between frames and matching them up in a Map
//   - Interpolate the joints for smoothness

class MediapipeBodyTrackingDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      ["../vendor/ml5.js"],
      "ml5 BodyPose MoveNet Demo",
      "ml5-bodypose-movenet-demo",
      `From the <a href="https://editor.p5js.org/ml5/sketches/c8sl_hGmN">ml5 bodypose/movenet</a> demo for multiple pose detection.`
    );
  }

  async init() {
    window._frameLoop = new FrameLoop(180, 4);
    _frameLoop.addListener(this);
    this.buildHTML();
    this.log = new EventLog(this.debugEl);
    this.log.log(`Starting up...`);
    this.webcamSample = `../data/videos/dancing.mp4`;
    this.demoImg = await ImageUtil.loadImageSync(`../data/images/towel.png`);
    if (this.webcamSample) {
      this.addWebcamSample();
    } else {
      this.addWebcamStartButton();
    }
    this.buildStats();
  }

  buildStats() {
    this.stats = new Stats();
    this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(this.stats.dom);
  }

  buildHTML() {
    // add css
    this.injectCSS(`
      #video-container {
        position: relative;
      }
      .video-layer {
      }
      video {
        width: 100%;
      }
      #output_canvas {
        position: absolute;
        top: 0;
        L: 0;
        display: none; 
        z-index: 9;
        pointer-events: none;
      }
    `);

    // build container for video & canvas layers
    this.videoContainer = this.buildContainer("video-container", false);
  }

  addWebcamStartButton() {
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
          this.videoReady(videoEl);
        },
        (error) => {
          this.el.innerHTML = "[Webcam ERROR] :: " + error;
        }
      );
    });
  }

  addWebcamSample() {
    let videoEl = document.createElement("video");
    videoEl.src = this.webcamSample;
    videoEl.setAttribute("autoplay", true);
    videoEl.setAttribute("playsinline", true);
    videoEl.setAttribute("loop", true);
    videoEl.setAttribute("muted", true);
    videoEl.setAttribute("controls", true);
    videoEl.classList.add("video-source");
    this.videoReady(videoEl);
  }

  videoReady(videoEl) {
    videoEl.classList.add("video-layer");
    this.videoEl = videoEl;
    this.videoContainer.appendChild(videoEl);
    // Webcam.flipH(videoEl);
    this.initBodyTracking();
    this.attachDetectionToVideo();
  }

  async initBodyTracking() {
    window._decrementPreload = (e) => {
      this.log.log(`Preload:`, e);
    };
    this.bodypose = await ml5.bodypose("MoveNet", {
      modelUrl: "../data/machine-learning/bodypose-tfjs/model.json",
    });
    setTimeout(() => {
      this.bodypose.detectStart(this.videoEl, (results) =>
        this.gotPoses(results)
      );
    }, 5000);
    this.poses = [];
  }

  gotPoses(results) {
    this.poses = results;
  }

  attachDetectionToVideo() {
    this.lastVideoTime = -1;

    // make sure the canvas is sized to the video stream
    const videoHeight = this.videoEl.videoHeight + "px";
    const videoWidth = this.videoEl.videoWidth + "px";
    if (!this.canvasElement) this.buildCanvasOverlay();
  }

  buildCanvasOverlay() {
    // build canvas layer
    // get client bounding rect for video
    let videoRect = this.videoEl.getBoundingClientRect();
    this.canvasElement = DOMUtil.stringToElement(`
      <canvas class="output_canvas video-layer" id="output_canvas" width="${videoRect.width}" height="${videoRect.height}"></canvas>
    `);
    this.videoContainer.appendChild(this.canvasElement);
    this.resizeCanvas();

    // store canvas props
    this.canvasCtx = this.canvasElement.getContext("2d");
    this.canvasElement.style.display = "block";
  }

  windowResized() {
    this.resizeCanvas();
  }

  resizeCanvas() {
    if (!this.videoEl) return;
    let videoRect = this.videoEl.getBoundingClientRect();
    this.canvasElement.style.width = videoRect.width + "px";
    this.canvasElement.style.height = videoRect.height + "px";
    this.canvasElement.width = videoRect.width;
    this.canvasElement.height = videoRect.height;
  }

  handleSkeletons() {
    if (!this.canvasElement) return;
    this.resizeCanvas();
    // clear canvas
    let canvW = this.canvasElement.width;
    let canvH = this.canvasElement.height;
    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, canvW, canvH);

    // debug
    this.debugEl.innerHTML = `
      <div>poses.length: ${this.poses.length}</div>
    `;

    // Draw all the tracked landmark points
    for (let i = 0; i < this.poses.length; i++) {
      let pose = this.poses[i];
      this.drawSkeleton(pose);
    }

    // finish drawing
    this.canvasCtx.restore();
  }

  drawSkeleton(pose) {
    // canvas-scaling helpers
    let scale = this.scale();

    // console.log(pose.keypoints.length); // 17!
    for (let j = 0; j < pose.keypoints.length; j++) {
      let keypoint = pose.keypoints[j];
      // Only draw a circle if the keypoint's confidence is bigger than 0.1
      if (keypoint.score > 0.1) {
        this.canvasCtx.fillStyle = "#ffffff";
        this.canvasCtx.fillRect(
          keypoint.x * scale - 5,
          keypoint.y * scale - 5,
          10,
          10
        );
      }
    }

    // draw lines between pairs
    for (let j = 0; j < Joints.pairs.length; j++) {
      let pair = Joints.pairs[j];
      let a = pose.keypoints[pair[0]];
      let b = pose.keypoints[pair[1]];
      this.canvasCtx.beginPath();
      this.canvasCtx.moveTo(a.x * scale, a.y * scale);
      this.canvasCtx.lineTo(b.x * scale, b.y * scale);
      this.canvasCtx.strokeStyle = "#ffffff";
      this.canvasCtx.strokeWeight = 3;
      this.canvasCtx.stroke();
    }

    // draw towel
    let torsoTopX =
      (this.x(pose, Joints.shoulderL) + this.x(pose, Joints.shoulderR)) / 2;
    let torsoTopY =
      (this.y(pose, Joints.shoulderL) + this.y(pose, Joints.shoulderR)) / 2;
    let torsoBotX = (this.x(pose, Joints.hipL) + this.x(pose, Joints.hipR)) / 2;
    let torsoBotY = (this.y(pose, Joints.hipL) + this.y(pose, Joints.hipR)) / 2;
    let torsoCenterX = (torsoTopX + torsoBotX) / 2;
    let torsoCenterY = (torsoTopY + torsoBotY) / 2;
    let torsoH = Math.sqrt(
      Math.pow(torsoBotX - torsoTopX, 2) + Math.pow(torsoBotY - torsoTopY, 2)
    );

    // get image size
    let imgTorsoScale = (torsoH / this.demoImg.height) * 1.8;
    let w = this.demoImg.width * imgTorsoScale;
    let h = this.demoImg.height * imgTorsoScale;

    // get rotation from torso top/bottom
    let dx = torsoBotX - torsoTopX;
    let dy = torsoBotY - torsoTopY;
    let angle = Math.atan2(dy, dx);

    // draw!
    this.canvasCtx.save();
    this.canvasCtx.translate(torsoCenterX, torsoCenterY);
    this.canvasCtx.rotate(angle - Math.PI / 2);
    this.canvasCtx.drawImage(this.demoImg, -w / 2, -h * 0.3, w, h);
    this.canvasCtx.restore();
  }

  scale() {
    return this.canvasElement.width / this.videoEl.videoWidth;
  }

  x(pose, joint) {
    return pose.keypoints[joint].x * this.scale();
  }

  y(pose, joint) {
    return pose.keypoints[joint].y * this.scale();
  }

  keyDown(key) {}

  frameLoop(frameCount) {
    if (this.stats) this.stats.begin();
    // this.predictWebcam();
    this.handleSkeletons();
    if (this.stats) this.stats.end();
  }
}

class Joints {
  static nose = 0;
  static eyeL = 1;
  static eyeR = 2;
  static earL = 3;
  static earR = 4;
  static shoulderL = 5;
  static shoulderR = 6;
  static elbowL = 7;
  static elbowR = 8;
  static wristL = 9;
  static wristR = 10;
  static hipL = 11;
  static hipR = 12;
  static kneeL = 13;
  static kneeR = 14;
  static ankleL = 15;
  static ankleR = 16;

  static pairs = [
    [Joints.nose, Joints.eyeL],
    [Joints.nose, Joints.eyeR],
    [Joints.eyeL, Joints.earL],
    [Joints.eyeR, Joints.earR],
    [Joints.eyeL, Joints.eyeR],
    [Joints.shoulderL, Joints.shoulderR],
    [Joints.shoulderL, Joints.hipL],
    [Joints.shoulderR, Joints.hipR],
    [Joints.shoulderL, Joints.elbowL],
    [Joints.shoulderR, Joints.elbowR],
    [Joints.elbowL, Joints.wristL],
    [Joints.elbowR, Joints.wristR],
    [Joints.hipL, Joints.hipR],
    [Joints.hipL, Joints.kneeL],
    [Joints.hipR, Joints.kneeR],
    [Joints.kneeL, Joints.ankleL],
    [Joints.kneeR, Joints.ankleR],
  ];
}

/*
class Skeleton {
  constructor(landmarks) {
    this.landmarks = landmarks;
    this.lastUpdate = performance.now();
  }

  joints() {
    return this.landmarks;
  }

  lerp(a, b, x) {
    return (1 - x) * a + x * b;
  }

  update(landmarks) {
    this.landmarks.forEach((el, i) => {
      // lerp towards new position
      el.x = this.lerp(el.x, landmarks[i].x, 0.2);
      el.y = this.lerp(el.y, landmarks[i].y, 0.2);
      el.z = this.lerp(el.z, landmarks[i].z, 0.2);
    });
    this.lastUpdate = performance.now();
  }
}
*/

if (window.autoInitDemo)
  window.demo = new MediapipeBodyTrackingDemo(document.body);
