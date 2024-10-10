import DemoBase from "./demo--base.js";
import CanvasUtil from "../src/canvas-util.js";
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
// - Start building custom AR elements library
// - Solve for responsive shrinking of canvas and pose scale transformations breaking
// - Try shrinking the image into a <canvas> to speed up ML detection
//   - Why is it so much slower with the webcam?
// - Hang onto skeletons for a few frames before pruning them, since a pose might be lost for several frames. Have a secondary array of skeletons that are "old", to make sure we check/match recent skeletons first
// - Work on camera & canvas cropping to handle different aspect ratios
// - Draw debug info on skeleton
// - Skeleton calculations
//   - Head & body angle based on closeness of sides vs overall scale
//   - Ignore skeletons smaller than a certain size???
//   - Calculate general body scale (we already have something like this based on video/camera height?)
// - Add events for skeleton detection: onSkeletonDetected, onSkeletonLost, onSkeletonUpdated
// - Move renderer to PIXI.js?

class MediapipeBodyTrackingDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
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
        opacity: 0.2;
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
    // window._decrementPreload = (e) => {
    //   this.log.log(`Preload:`, e);
    // };

    // load & start ML tool
    this.bodyPose = await ml5.bodyPose("MoveNet", {
      modelUrl: "../data/machine-learning/bodypose-new/model.json",
    });
    setTimeout(() => {
      this.bodyPose.detectStart(this.videoEl, (results) =>
        this.gotPoses(results)
      );
    }, 1000);

    // start persistent skeleton storage/tracking
    this.poses = [];
    this.skeletons = [];
    this.connections = this.bodyPose.getSkeleton(); // same array as Joints.pairs
    this.arElement = new ARElement();
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

  gotPoses(results) {
    results.forEach((pose) => {
      pose.keypoints.forEach((el) => {
        el.x *= this.scale();
        el.y *= this.scale();
      });
    });
    this.poses = results;
    this.posesCount = results.length;
    this.comparePoses();
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
          if (skeleton.matchesPose(pose)) {
            foundMatch = true;
            skeleton.setTargetPose(pose);
            this.poses.splice(i, 1);
          }
        }
      }
      if (!foundMatch) {
        this.skeletons.push(new Skeleton(pose, this.arElement));
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

  updateSkeletons() {
    if (!this.canvasElement) return;
    if (!this.poses || this.poses.length == 0) {
      // console.log("NO POSES");
    }
    // if (!this.poses) return;
    this.resizeCanvas();
    this.prepCanvas();
    this.updateDebugText();
    this.drawSkeletons();
    this.canvasCtx.restore();
  }

  prepCanvas() {
    let canvW = this.canvasElement.width;
    let canvH = this.canvasElement.height;
    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, canvW, canvH);
  }

  updateDebugText() {
    if (this.posesCount) {
      this.debugEl.innerHTML = `
      <div>poses.length: ${this.posesCount}</div>
      <div>skeletons.length: ${this.skeletons.length}</div>
      <div>Skeleton.count: ${Skeleton.count}</div>
    `;
    }
  }

  drawSkeletons() {
    for (let i = 0; i < this.skeletons.length; i++) {
      this.skeletons[i].update();
      this.skeletons[i].drawDebug(this.canvasCtx, this.scale());
      this.skeletons[i].drawArElements(this.canvasCtx, this.scale());
    }
  }

  scale() {
    return this.canvasElement.height / this.videoEl.videoHeight;
  }

  keyDown(key) {}

  frameLoop(frameCount) {
    if (this.stats) this.stats.begin();
    this.updateSkeletons();
    if (this.stats) this.stats.end();
  }
}

//////////////////////////////////////////////////
// Skeleton
//////////////////////////////////////////////////

class Skeleton {
  constructor(pose, arElement = null) {
    this.pose = pose;
    this.targetPose = pose; // keep a copy and a target of the initial pose
    this.lastUpdate = performance.now();
    this.updatedLastFrame = true;
    Skeleton.count++;
    this.debugColor = Joints.colors[Skeleton.count % Joints.colors.length];
    this.arElement = arElement;
  }

  static count = 0;
  static DIST_THRESH = 800;

  joints() {
    return this.pose.keypoints;
  }

  matchesPose(pose) {
    // calculate total distance between pose and skeleton and pose
    let totalDist = 0;
    if (!window.hasLogged) {
      console.log("pose.keypoints", pose.keypoints);
      console.log("this.joints()", this.joints());
      window.hasLogged = true;
    }
    for (let i = 0; i < pose.keypoints.length; i++) {
      let poseJoint = pose.keypoints[i];
      let skelJoint = this.joints()[i];
      let dist = MathUtil.getDistance(
        poseJoint.x,
        poseJoint.y,
        skelJoint.x,
        skelJoint.y
      );

      // Ignore hands/elbows, since these can flail, and increase the threshold for matching skeletons
      if (!this.ignoreJoint(i)) {
        totalDist += dist;
      }
    }

    // return whether we've matched
    let didMatch = totalDist < Skeleton.DIST_THRESH;
    return didMatch;
  }

  ignoreJoint(i) {
    return (
      i == Joints.wristL ||
      i == Joints.wristR ||
      i == Joints.elbowL ||
      i == Joints.elbowR ||
      i == Joints.ankleL ||
      i == Joints.ankleR
    );
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

  setTargetPose(pose) {
    this.targetPose = pose;
    this.updatedLastFrame = true;
    this.lastUpdate = performance.now();
  }

  update() {
    let easeFactor = 0.3;
    this.pose.keypoints.forEach((el, i) => {
      // lerp towards new position
      el.x = this.lerp(el.x, this.targetPose.keypoints[i].x, easeFactor);
      el.y = this.lerp(el.y, this.targetPose.keypoints[i].y, easeFactor);
      el.z = this.lerp(el.z, this.targetPose.keypoints[i].z, easeFactor);
    });
  }

  drawArElements(ctx, scale) {
    if (this.arElement) this.arElement.update(ctx, scale, this);
  }

  drawDebug(ctx, scale) {
    ctx.save();
    ctx.lineWidth = 3;

    // color per skeleton
    let curColor = this.debugColor;

    // console.log(pose.keypoints.length); // 17!
    let keypoints = this.joints();
    for (let j = 0; j < keypoints.length; j++) {
      let keypoint = keypoints[j];
      // Only draw a circle if the keypoint's confidence is bigger than 0.1
      if (keypoint.confidence > 0.1) {
        ctx.strokeStyle = curColor;
        ctx.fillStyle = "transparent";
        // ctx.strokeRect(keypoint.x - 5, keypoint.y - 5, 10, 10);
        CanvasUtil.drawCircle(ctx, keypoint.x, keypoint.y, 5);
      }
    }

    // draw lines between pairs
    for (let j = 0; j < Joints.pairs.length; j++) {
      let pair = Joints.pairs[j];
      let a = keypoints[pair[0]];
      let b = keypoints[pair[1]];
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = curColor;
      ctx.stroke();
    }
    ctx.restore();
  }
}

//////////////////////////////////////////////////
// ARElement
//////////////////////////////////////////////////

class ARElement {
  constructor() {
    this.loadAssets();
  }

  async loadAssets() {
    this.demoImg = await ImageUtil.loadImageSync(`../data/images/smiley.png`);
  }

  x(keypoints, joint) {
    return keypoints[joint].x; //  * this.scale()
  }

  y(keypoints, joint) {
    return keypoints[joint].y;
  }

  update(ctx, scale, skeleton) {
    let keypoints = skeleton.joints();
    // draw image
    let torsoTopX =
      (keypoints[Joints.shoulderL].x + keypoints[Joints.shoulderR].x) / 2;
    let torsoTopY =
      (keypoints[Joints.shoulderL].y + keypoints[Joints.shoulderR].y) / 2;
    let torsoBotX = (keypoints[Joints.hipL].x + keypoints[Joints.hipR].x) / 2;
    let torsoBotY = (keypoints[Joints.hipL].y + keypoints[Joints.hipR].y) / 2;
    let torsoCenterX = (torsoTopX + torsoBotX) / 2;
    let torsoCenterY = (torsoTopY + torsoBotY) / 2;
    let torsoH = Math.sqrt(
      Math.pow(torsoBotX - torsoTopX, 2) + Math.pow(torsoBotY - torsoTopY, 2)
    );

    // get image size
    let imgTorsoScale = (torsoH / this.demoImg.height) * 1.5;
    let w = this.demoImg.width * imgTorsoScale;
    let h = this.demoImg.height * imgTorsoScale;

    // get rotation from torso top/bottom
    let dx = torsoBotX - torsoTopX;
    let dy = torsoBotY - torsoTopY;
    let angle = Math.atan2(dy, dx);

    // draw!
    ctx.save();
    ctx.translate(torsoCenterX, torsoCenterY);
    ctx.rotate(angle - Math.PI / 2);
    ctx.drawImage(this.demoImg, -w / 2, -h / 2, w, h);
    ctx.restore();
  }
}

//////////////////////////////////////////////////
// Joints definitions & connections
//////////////////////////////////////////////////

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

  static colors = ["#ffff00", "#ff00ff", "#00ffff", "#8888ff", "#ff0000"];
}

if (window.autoInitDemo)
  window.demo = new MediapipeBodyTrackingDemo(document.body);
