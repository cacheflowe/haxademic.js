import DemoBase from "./demo--base.js";
import DOMUtil from "../src/dom-util.js";
import EventLog from "../src/event-log.js";
import MathUtil from "../src/math-util.js";
import ImageUtil from "../src/image-util.js";
import FrameLoop from "../src/frame-loop.js";
import Webcam from "../src/webcam.js";
import Stats from "../vendor/stats.module.js";

// ML5 version - NOT MINIFIED, which causes errors for me
// - https://github.com/ml5js/ml5-next-gen
// - https://unpkg.com/ml5@1.0.1/dist/ml5.js
//   - Came from: https://unpkg.com/ml5@latest/dist/ml5.js
// - Original demo code: https://editor.p5js.org/ml5/sketches
// - https://editor.p5js.org/ml5/sketches/hMN9GdrO3

// NOTES
// - https://editor.p5js.org/ml5/sketches/c8sl_hGmN (OLD)
// - https://github.com/ml5js/ml5-next-gen/blob/main/src/Bodypose/index.js
// - https://github.com/ml5js/ml5-library/issues/478 - loading models offline
// - https://www.kaggle.com/models/google/movenet
// - https://www.kaggle.com/models/google/movenet/frameworks/tfJs - download model here
// - https://www.tensorflow.org/lite/examples/pose_estimation/overview - model landmark points explanation
// - https://github.com/tensorflow/tfjs-models/blob/master/pose-detection/src/movenet/README.md

// TODO
// - Try shrinking the image into a <canvas> to speed up detection
//   - Why is it so much slower with the webcam?
// - [WORKING] Track skeletons over time by checking distance between frames and matching them up in a Map
//   - Hang onto skeletons for a few frames before pruning them, since a pose might be lost for several frames. Have a secondary array of skeletons that are "old", to make sure we check/match recent skeletons first
//   - Ignore arms/hads/elbows, since these can flail, and increase the threshold for matching skeletons

class MediapipeBodyTrackingDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      // ["../vendor/ml5-v0.20.0-alpha.4.js"],
      ["../vendor/ml5.js"],
      "ml5 BodyPose Demo",
      "ml5-bodypose-demo",
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
    this.demoImg = await ImageUtil.loadImageSync(`../data/images/particle.png`);
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
    this.videoEl.play();
    // Webcam.flipH(videoEl);
    this.initBodyTracking();
    this.attachDetectionToVideo();
  }

  async initBodyTracking() {
    window._decrementPreload = (e) => {
      this.log.log(`Preload:`, e);
    };
    this.bodyPose = await ml5.bodyPose("MoveNet", {
      modelUrl: "../data/machine-learning/bodypose-new/model.json",
    });
    setTimeout(() => {
      this.bodyPose.detectStart(this.videoEl, (results) =>
        this.gotPoses(results)
      );
    }, 1000);
    this.poses = [];
    this.skeletons = [];
    this.connections = this.bodyPose.getSkeleton(); // same array as Joints.pairs
  }

  gotPoses(results) {
    this.poses = results;
    this.posesCount = results.length;
    this.comparePoses();
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

  comparePoses() {
    if (!this.poses) return;
    // reset for pruning
    for (let j = 0; j < this.skeletons.length; j++) {
      let skeleton = this.skeletons[j];
      skeleton.reset();
    }

    // step 1: loop through poses and skeletons backwards, and update existing skeletons if they are close enough in total position. remove poses that have been matched
    // step 2: for remaining poses with no match, create a new skeleton and pass in pose data, and remove pose from list
    for (let i = this.poses.length - 1; i >= 0; i--) {
      let pose = this.poses[i];
      let foundMatch = false;
      for (let j = 0; j < this.skeletons.length; j++) {
        if (foundMatch == false) {
          let skeleton = this.skeletons[j];
          let dist = this.distanceBetweenSkeletons(pose, skeleton);
          // console.log(dist);
          if (dist < 1500) {
            foundMatch = true;
            skeleton.update(pose);
            this.poses.splice(i, 1);
          }
        }
      }
      if (!foundMatch) {
        this.skeletons.push(new Skeleton(pose));
        this.poses.splice(i, 1);
      }
    }

    // prune old skeletons
    for (let j = this.skeletons.length - 1; j >= 0; j--) {
      let skeleton = this.skeletons[j];
      if (skeleton.didUpdate() == false) {
        this.skeletons.splice(j, 1);
      }
    }
  }

  distanceBetweenSkeletons(pose, skeleton) {
    let totalDist = 0;
    for (let i = 0; i < pose.keypoints.length; i++) {
      let posePoint = pose.keypoints[i];
      let skeletonPoint = skeleton.joints()[i];
      let dist = MathUtil.getDistance(
        posePoint.x,
        posePoint.y,
        skeletonPoint.x,
        skeletonPoint.y
      );
      totalDist += dist;
    }
    return totalDist;
  }

  handleSkeletons() {
    if (!this.canvasElement) return;
    if (!this.poses) return;

    this.resizeCanvas();
    // clear canvas
    let canvW = this.canvasElement.width;
    let canvH = this.canvasElement.height;
    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, canvW, canvH);

    // debug
    if (this.posesCount) {
      this.debugEl.innerHTML = `
      <div>poses.length: ${this.posesCount}</div>
      <div>skeletons.length: ${this.skeletons.length}</div>
      <div>Skeleton.count: ${Skeleton.count}</div>
    `;
    }

    // Draw all the tracked landmark points
    for (let i = 0; i < this.skeletons.length; i++) {
      this.drawSkeleton(this.skeletons[i]);
    }

    // finish drawing
    this.canvasCtx.restore();
  }

  drawSkeleton(skeleton, index) {
    // canvas-scaling helpers
    let scale = this.scale();

    // color per skeleton
    let curColor = skeleton.debugColor;

    // console.log(pose.keypoints.length); // 17!
    let keypoints = skeleton.joints();
    for (let j = 0; j < keypoints.length; j++) {
      let keypoint = keypoints[j];
      // console.log(keypoint);
      // Only draw a circle if the keypoint's confidence is bigger than 0.1
      if (keypoint.confidence > 0.1) {
        this.canvasCtx.strokeStyle = curColor;
        this.canvasCtx.strokeRect(
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
      let a = keypoints[pair[0]];
      let b = keypoints[pair[1]];
      this.canvasCtx.beginPath();
      this.canvasCtx.moveTo(a.x * scale, a.y * scale);
      this.canvasCtx.lineTo(b.x * scale, b.y * scale);
      this.canvasCtx.strokeStyle = curColor;
      this.canvasCtx.strokeWeight = 3;
      this.canvasCtx.stroke();
    }

    // draw image
    let torsoTopX =
      (this.x(keypoints, Joints.shoulderL) +
        this.x(keypoints, Joints.shoulderR)) /
      2;
    let torsoTopY =
      (this.y(keypoints, Joints.shoulderL) +
        this.y(keypoints, Joints.shoulderR)) /
      2;
    let torsoBotX =
      (this.x(keypoints, Joints.hipL) + this.x(keypoints, Joints.hipR)) / 2;
    let torsoBotY =
      (this.y(keypoints, Joints.hipL) + this.y(keypoints, Joints.hipR)) / 2;
    let torsoCenterX = (torsoTopX + torsoBotX) / 2;
    let torsoCenterY = (torsoTopY + torsoBotY) / 2;
    let torsoH = Math.sqrt(
      Math.pow(torsoBotX - torsoTopX, 2) + Math.pow(torsoBotY - torsoTopY, 2)
    );

    // get image size
    let imgTorsoScale = (torsoH / this.demoImg.height) * 5;
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
    this.canvasCtx.drawImage(this.demoImg, -w / 2, -h / 2, w, h);
    this.canvasCtx.restore();
  }

  scale() {
    return this.canvasElement.width / this.videoEl.videoWidth;
  }

  x(keypoints, joint) {
    return keypoints[joint].x * this.scale();
  }

  y(keypoints, joint) {
    return keypoints[joint].y * this.scale();
  }

  keyDown(key) {}

  frameLoop(frameCount) {
    if (this.stats) this.stats.begin();
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

  static colors = [
    "#ffff00",
    "#ff00ff",
    "#00ffff",
    "#0000ff",
    "#ff0000",
    "#0000ff",
  ];
}

class Skeleton {
  constructor(pose) {
    this.pose = pose;
    this.lastUpdate = performance.now();
    this.updatedLastFrame = true;
    Skeleton.count++;
    this.debugColor = Joints.colors[Skeleton.count % Joints.colors.length];
  }

  static count = 0;

  joints() {
    return this.pose.keypoints;
  }

  lerp(a, b, x) {
    return (1 - x) * a + x * b;
  }

  reset() {
    this.updatedLastFrame = false;
  }

  didUpdate() {
    return this.updatedLastFrame;
  }

  update(pose) {
    let easeFactor = 0.4;
    this.updatedLastFrame = true;
    this.lastUpdate = performance.now();
    this.pose.keypoints.forEach((el, i) => {
      // lerp towards new position
      el.x = this.lerp(el.x, pose.keypoints[i].x, easeFactor);
      el.y = this.lerp(el.y, pose.keypoints[i].y, easeFactor);
      el.z = this.lerp(el.z, pose.keypoints[i].z, easeFactor);
    });
    this.lastUpdate = performance.now();
  }
}

if (window.autoInitDemo)
  window.demo = new MediapipeBodyTrackingDemo(document.body);
