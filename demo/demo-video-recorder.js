import DemoBase from "./demo--base.js";
import * as THREE from "../vendor/three/three.module.js";
import FrameLoop from "../src/frame-loop.js";
import ThreeScene from "../src/three-scene-.js";
// VideoRecorder is included in DemoBase
// import VideoRecorder from '../src/video-recorder.js';

class VideoRecorderDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "VideoRecorder",
      "webgl-container",
      "Shows the seamless recording of a canvas element, exported to a downloadable video file. Just wait a couple of rotations..."
    );
  }

  init() {
    // setup
    this.el.setAttribute("style", "height: 500px;");
    this.setupScene();
    this.buildCube();
    this.addLights();
    this.addResizeListener();
    super.initRecording(this.threeScene.canvasEl(), 300, 50);
    this.initAnimation();
  }

  // recording setup

  initAnimation() {
    window._frameLoop = new FrameLoop(this.loopFrames).addListener(this);
  }

  // ANIMATE

  frameLoop(frameCount) {
    // cube rotate
    this.cubeMesh.rotation.y = _frameLoop.getProgressRads();
    this.cubeMesh.rotation.x = Math.sin(_frameLoop.getProgressRads()) * 0.4;

    // render THREE scene and record to disk
    this.threeScene.render();
    this.renderVideo();
  }

  // THREE.js

  setupScene() {
    this.threeScene = new ThreeScene(this.el, 0xffffff);
    this.scene = this.threeScene.getScene();
    this.camera = this.threeScene.getCamera();
  }

  buildCube() {
    let cubeSize = 150;
    this.materialCube = new THREE.MeshPhongMaterial({
      color: 0x00ffbb, // 0x00ffbb
      emissive: 0x000000, // 0x000000
      specular: 0x666666,
      shininess: 10,
      flatShading: false,
    });

    this.cubeMesh = new THREE.Mesh(
      new THREE.BoxBufferGeometry(cubeSize, cubeSize * 0.4, cubeSize * 0.4),
      this.materialCube
    );
    this.cubeMesh.castShadow = true;
    this.cubeMesh.position.set(0, 30, 0);
    this.scene.add(this.cubeMesh);
  }

  addLights() {
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);
    var pointLight = new THREE.PointLight(0x444444, 1, 0);
    pointLight.position.set(-100, 100, 50);
    this.scene.add(pointLight);
  }

  // WINDOW RESIZE

  addResizeListener() {
    window.addEventListener("resize", () => this.resize());
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 400);
  }

  resize() {
    this.threeScene.resize();
  }
}

if (window.autoInitDemo) window.demo = new VideoRecorderDemo(document.body);
