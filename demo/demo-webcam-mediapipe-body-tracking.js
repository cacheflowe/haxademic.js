import DemoBase from "./demo--base.js";
import DOMUtil from "../src/dom-util.js";
import EventLog from "../src/event-log.js";
import FrameLoop from "../src/frame-loop.js";
import Webcam from "../src/webcam.js";
import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/vision_bundle.mjs";
// } from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";

class MediapipeBodyTrackingDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "MediaPipe Body Tracking",
      "mediapipe-body-tracking-demo",
      `From the <a href="https://codepen.io/mediapipe-preview/pen/abRLMxN">MediaPipe Pose</a> demo and <a href="https://mediapipe-studio.webapps.google.com/studio/demo/pose_landmarker">official docs</a>. Landmark data info is <a href="https://developers.google.com/mediapipe/solutions/vision/pose_landmarker">here</a>.`
    );
  }

  // TODO:
  // Skeletons
  // - Track skeletons between frames - is the object the same, but repopulated? Or is it a different object every frame? - It looks like they're the same object!
  // - Discard bad skeletons - how to tell if a skeleton is bad? Overall scale & distance between certain points
  // - Attach AR elements with scale taken into account - figure out appropriate ranges for scale mapping
  // - Skeleton smoothing - how to smooth out the skeleton data. Need a skeleton object to track over time, and smooth out the data
  // - Add debug data draw in canvas to show skeleton data for reference
  // - Make sure async detection is optimized and not doing more work than it should
  // - Give local skeletons array a timeout to remove skeletons that haven't been updated in a while - we don't want to lose skeletons to detection noise, but we're not sure if they would repopulate with the same object.. In this case, we'd have to track position and match them back up!
  // General
  // - Flip the canvas drawing for mirrored video
  // - Add debug logging for when model loads, etc
  // - Try different models (lite (5mb),full,heavy (30mb))
  // - Load CDN .js & models locally as an option (for offline use)
  // INFO
  // - https://mediapipe-studio.webapps.google.com/studio/demo/pose_landmarker
  // - https://storage.googleapis.com/mediapipe-assets/studio/prod/alkali.mediapipestudio_20231214_0657_RC00/vision_wasm_internal.wasm
  // - https://codepen.io/mediapipe-preview/pen/abRLMxN - this is not as good as the following
  // - https://mediapipe-studio.webapps.google.com/studio/demo/pose_landmarker
  // - https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
  // - https://developers.google.com/mediapipe/solutions/vision/pose_landmarker/web_js
  // - https://developers.google.com/mediapipe/api/solutions/js/tasks-vision.drawingutils
  // - https://www.jsdelivr.com/package/npm/@mediapipe/tasks-vision?tab=files
  // MULTIPLE SKELETONS
  // - Work great:
  //   - https://github.com/tensorflow/tfjs-models/tree/master/pose-detection
  //   - https://editor.p5js.org/kylemcdonald/sketches/H1OoUd9h7
  //   - https://editor.p5js.org/ml5/sketches/c8sl_hGmN - bodypose movenet 2023
  //   - https://editor.p5js.org/ml5/sketches/rP8x1mML0O - posenet 2019

  init() {
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
        left: 0;
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
  }

  async initBodyTracking() {
    // this.curSkeleton = null;
    this.skeletons = new Map();
    await this.createPoseLandmarker();
    this.attachDetectionToVideo();
  }

  async createPoseLandmarker() {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm"
      // "https://storage.googleapis.com/mediapipe-assets/studio/prod/alkali.mediapipestudio_20231214_0657_RC00/vision_wasm_internal.wasm"
    );
    const landmarkerOptions = {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
        // modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task`,
        // modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task`,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numPoses: 5,
      minPoseDetectionConfidence: 0.2,
      minPosePresenceConfidence: 0.2,
      minTrackingConfidence: 0.2,
      outputSegmentationMasks: false,
    };
    this.poseLandmarker = await PoseLandmarker.createFromOptions(
      vision,
      landmarkerOptions
    );
    console.log("poseLandmarker", this.poseLandmarker);
  }

  attachDetectionToVideo() {
    this.lastVideoTime = -1;

    // make sure the canvas is sized to the video stream
    const videoHeight = this.videoEl.videoHeight + "px";
    const videoWidth = this.videoEl.videoWidth + "px";
    if (!this.canvasElement) this.buildCanvasOverlay();
    // this.canvasElement.style.height = videoHeight;
    // this.videoEl.style.height = videoHeight;
    // this.canvasElement.style.width = videoWidth;
    // this.videoEl.style.width = videoWidth;
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
    this.drawingUtils = new DrawingUtils(this.canvasCtx);
    this.canvasElement.style.display = "block";
  }

  windowResized() {
    this.resizeCanvas();
  }

  resizeCanvas() {
    let videoRect = this.videoEl.getBoundingClientRect();
    this.canvasElement.style.width = videoRect.width + "px";
    this.canvasElement.style.height = videoRect.height + "px";
    this.canvasElement.width = videoRect.width;
    this.canvasElement.height = videoRect.height;
  }

  async predictWebcam() {
    let startTimeMs = performance.now();
    if (this.lastVideoTime !== this.videoEl.currentTime) {
      this.lastVideoTime = this.videoEl.currentTime;
      this.poseLandmarker.detectForVideo(
        this.videoEl,
        startTimeMs,
        (result) => {
          this.handleSkeletons(result);
        }
      );
    }
  }

  handleSkeletons(result) {
    this.resizeCanvas();
    // clear canvas
    let canvW = this.canvasElement.width;
    let canvH = this.canvasElement.height;
    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, canvW, canvH);

    // debug
    this.debugEl.innerHTML = `
      <div>skeletons: ${result.landmarks.length}</div>
    `;

    // log data if we haven't yet, to see what's in the results
    // we check for a good skeleton, and log it once
    if (result.landmarks && result.landmarks.length > 0) {
      // log once, so we know what a result looks like
      if (!window.logged) {
        console.log(result);
        window.logged = true;
      }

      // loop through landmarks and check dictionary of skeletons
      for (const skelData of result.landmarks) {
        //   if (this.skeletons.has(skelData)) {
        //     console.log("reusing  skelly");
        //     this.skeletons.get(skelData).update(skelData);
        //   } else {
        //     console.log("new skelly", skelData);
        //     this.skeletons.set(skelData, new Skeleton(skelData));
        //   }
        //   let skeleton = this.skeletons.get(skelData);
        //   this.drawSkeleton(skeleton.joints());
        this.drawSkeleton(skelData);
      }

      // // clean up if skeletons are missing
      // console.log(this.skeletons.size);
      // this.skeletons.keys().forEach((key) => {
      //   let skelData = this.skeletons.get(key);
      //   if (skelData.lastUpdate < performance.now() - 1000) {
      //     this.skeletons.delete(key);
      //   }
      // });

      // track changing of skeletons
      // if (!this.curSkeleton) {
      let firstSkeleton = result.landmarks[0];
      if (this.curSkeleton != firstSkeleton) {
        this.curSkeleton = firstSkeleton;
        // console.log("new skeleton", firstSkeleton);
      } else {
        this.curSkeleton = firstSkeleton;
        // console.log("new skeleton same as old");
      }
      // }
    } else {
      // this.curSkeleton = null;
      console.log("no skeleton");
    }

    // draw new skeletons
    // for (const landmark of result.landmarks) {
    //   this.drawingUtils.drawLandmarks(landmark, {
    //     radius: (data) => DrawingUtils.lerp(data.from.z, -0.15, 0.1, 5, 1),
    //   });
    //   this.drawingUtils.drawConnectors(
    //     landmark,
    //     PoseLandmarker.POSE_CONNECTIONS
    //   );
    // }

    // finish drawing
    this.canvasCtx.restore();

    // draw segmentation mask
    if (result.segmentationMasks && result.segmentationMasks.length > 0) {
      let mask = result.segmentationMasks[0];
      // console.log(mask.canvas);
      this.canvasCtx.drawImage(
        mask.canvas.transferToImageBitmap(),
        0,
        0,
        canvW,
        canvH
      );
    }
  }

  drawSkeleton(landmarks) {
    this.drawingUtils.drawLandmarks(landmarks, {
      radius: (data) => DrawingUtils.lerp(data.from.z, -0.15, 0.1, 5, 1),
    });
    this.drawingUtils.drawConnectors(
      landmarks,
      PoseLandmarker.POSE_CONNECTIONS
    );
  }

  keyDown(key) {}

  frameLoop(frameCount) {
    if (this.drawingUtils) {
      this.predictWebcam();
    }
  }
}

class Joints {
  static nose = 0;
  static left_eye_inner = 1;
  static left_eye = 2;
  static left_eye_outer = 3;
  static right_eye_inner = 4;
  static right_eye = 5;
  static right_eye_outer = 6;
  static left_ear = 7;
  static right_ear = 8;
  static mouth_left = 9;
  static mouth_right = 10;
  static shoulder_left = 11;
  static shoulder_right = 12;
  static left_elbow = 13;
  static right_elbow = 14;
  static left_wrist = 15;
  static right_wrist = 16;
  static left_pinky = 17;
  static right_pinky = 18;
  static left_index = 19;
  static right_index = 20;
  static left_thumb = 21;
  static right_thumb = 22;
  static left_hip = 23;
  static right_hip = 24;
  static left_knee = 25;
  static right_knee = 26;
  static left_ankle = 27;
  static right_ankle = 28;
  static left_heel = 29;
  static right_heel = 30;
  static left_foot_index = 31;
  static right_foot_index = 32;
}

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

if (window.autoInitDemo)
  window.demo = new MediapipeBodyTrackingDemo(document.body);
