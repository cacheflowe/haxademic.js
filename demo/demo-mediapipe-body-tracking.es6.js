import DemoBase from "./demo--base.es6.js";
import DOMUtil from "../src/dom-util.es6.js";
import FrameLoop from "../src/frame-loop.es6.js";
import Webcam from "../src/webcam.es6.js";
import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";

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

  init() {
    window._frameLoop = new FrameLoop(180, 4);
    _frameLoop.addListener(this);
    this.buildHTML();
    this.buildStartButton();
  }

  buildHTML() {
    // add css
    this.injectCSS(`
      #video-container {
        position: relative;
      }
      .video-layer {
        position: absolute;
        top: 0;
        left: 0;
      }
    `);

    // build container for video & canvas layers
    this.videoContainer = this.buildContainer("video-container", false);

    // build canvas layer
    this.canvasElement = DOMUtil.stringToElement(`
      <canvas class="output_canvas video-layer" id="output_canvas" style="display:none; z-index:9" width="1280" height="720"></canvas>
    `);
    this.videoContainer.appendChild(this.canvasElement);
  }

  buildStartButton() {
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

  videoReady(videoEl) {
    videoEl.classList.add("video-layer");
    this.videoEl = videoEl;
    this.videoContainer.appendChild(videoEl);
    // Webcam.flipH(videoEl);
    this.initBodyTracking();
  }

  initBodyTracking() {
    this.curSkeleton = null;
    const createPoseLandmarker = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
          // modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task`,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 4,
      });

      this.attachDetectionToVideo();
    };
    createPoseLandmarker();
  }

  attachDetectionToVideo() {
    this.lastVideoTime = -1;
    this.canvasCtx = this.canvasElement.getContext("2d");
    this.drawingUtils = new DrawingUtils(this.canvasCtx);
    this.canvasElement.style.display = "block";

    // make sure the canvas is sized to the video stream
    const videoHeight = this.videoEl.videoHeight + "px";
    const videoWidth = this.videoEl.videoWidth + "px";
    this.canvasElement.style.height = videoHeight;
    this.videoEl.style.height = videoHeight;
    this.canvasElement.style.width = videoWidth;
    this.videoEl.style.width = videoWidth;
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
    // clear canvas
    let canvW = this.canvasElement.width;
    let canvH = this.canvasElement.height;
    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, canvW, canvH);

    // log data if we haven't yet, to see what's in the results
    // we check for a good skeleton, and log it once
    if (result.landmarks && result.landmarks.length > 0) {
      // log once
      if (!window.logged) {
        console.log(result);
        window.logged = true;
      }
      // track changing of skeletons
      if (!this.curSkeleton) {
        let firstSkeleton = result.landmarks[0];
        if (this.curSkeleton != firstSkeleton) {
          this.curSkeleton = firstSkeleton;
          console.log("new skeleton");
        } else {
          this.curSkeleton = firstSkeleton;
          console.log("new skeleton same as old");
        }
      }
    } else {
      this.curSkeleton = null;
      console.log("no skeleton");
    }

    // draw new skeletons
    for (const landmark of result.landmarks) {
      this.drawingUtils.drawLandmarks(landmark, {
        radius: (data) => DrawingUtils.lerp(data.from.z, -0.15, 0.1, 5, 1),
      });
      this.drawingUtils.drawConnectors(
        landmark,
        PoseLandmarker.POSE_CONNECTIONS
      );
    }

    // finish drawing
    this.canvasCtx.restore();
  }

  keyDown(key) {}

  frameLoop(frameCount) {
    if (this.drawingUtils) {
      this.predictWebcam();
    }
  }
}

if (window.autoInitDemo)
  window.demo = new MediapipeBodyTrackingDemo(document.body);
