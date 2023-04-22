import DemoBase from "./demo--base.es6.js";
import * as THREE from "../vendor/three/three.module.js";
import DragDropUtil from "../src/drag-drop-util.es6.js";
import FrameLoop from "../src/frame-loop.es6.js";
import MobileUtil from "../src/mobile-util.es6.js";
import PointerPos from "../src/pointer-pos.es6.js";
import ThreeScene from "../src/three-scene-.es6.js";
import UIControlPanel from "../src/ui-control-panel.es6.js";
import VideoUtil from "../src/video-util.es6.js";

class ThreeSceneVideoDisplaceTextureDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      ["!../vendor/guify.min.js"],
      "ThreeScene | Video Texture Displacement",
      "three-scene-video-texture",
      "Video texture in an FBO for post-processing effects"
    );
  }

  init() {
    this.el.setAttribute("style", "height: 600px;");
    this.addDropOverCSS();
    this.setupScene();
    this.addLights();
    this.buildVideoMesh();
    this.startAnimation();
    this.setupInput();
    this.setupUI();
    this.setupDragDrop();
    this.addDropOverCSS();
  }

  setupScene() {
    this.threeScene = new ThreeScene(this.el, 0x111111);
    this.scene = this.threeScene.getScene();
  }

  // camera rotate via mouse

  setupInput() {
    this.pointerPos = new PointerPos();
    // MobileUtil.lockTouchScreen(true);
    MobileUtil.disableTextSelect(document.body, true);
  }

  // UI

  setupUI() {
    window._ui = new UIControlPanel(document.body, "Video Texture");
    _ui.addSliderRange(
      "DisplacementRange",
      "displaceRange",
      [-50, 50],
      -200,
      200
    );
    _ui.addListener(this);
  }

  guiValueUpdated(key, value) {
    console.log('guiValueUpdated: "' + key + '" = ' + value);
  }

  // drag/drop

  setupDragDrop() {
    DragDropUtil.dropFile(this.el, (fileResult) => {
      this.videoEl.src = fileResult;
      this.videoEl.play();
    });
  }

  // THREE scene

  addLights() {
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.99);
    this.scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0.3, 0, 1); // default: (0, 1, 0);
    this.scene.add(directionalLight);

    var pointLight = new THREE.PointLight(0xffffff, 3, 500, 2);
    pointLight.position.set(0, 0, 300);
    this.scene.add(pointLight);
  }

  buildVideoMesh() {
    // setup
    this.videoDebugEl = document.getElementById("video-debug");

    // add video element
    let videoPath = "../data/videos/wash-your-hands.mp4";
    this.videoEl = VideoUtil.buildVideoEl(videoPath, true);
    this.videoEl.style.setProperty("width", "320px");
    this.debugEl.appendChild(this.videoEl);

    // add THREE video texture
    this.videoTexture = new THREE.VideoTexture(this.videoEl);
    this.videoTexture.minFilter = THREE.LinearFilter;
    this.videoTexture.magFilter = THREE.LinearFilter;
    this.videoTexture.format = THREE.RGBFormat;

    // build shape
    let planeResolution = 200;
    this.planeGeometry = new THREE.PlaneGeometry(
      250,
      250,
      planeResolution,
      planeResolution
    );
    this.planeMaterial = new THREE.MeshPhongMaterial({
      color: 0x555555,
      side: THREE.DoubleSide,
      wireframe: false,
      emissive: 0x222222, // 0x000000
      specular: 0x333333,
      shininess: 10,
      map: this.videoTexture,
      // normalMap: this.videoTexture,
      displacementMap: this.videoTexture,
      displacementScale: 50,
      // transparent: true,
      // opacity: 0.8,
    });
    this.plane = new THREE.Mesh(this.planeGeometry, this.planeMaterial);
    this.scene.add(this.plane);
  }

  startAnimation() {
    window._frameLoop = new FrameLoop().addListener(this);
  }

  frameLoop(frameCount) {
    // update camera
    this.plane.rotation.y = -1 + 2 * this.pointerPos.xNorm(this.el);
    this.plane.rotation.x = -1 + 2 * this.pointerPos.yNorm(this.el);

    // update displacement
    let displaceRange = _ui.value("displaceRange");
    this.planeMaterial.displacementScale = _frameLoop.osc(
      0.03,
      displaceRange[0],
      displaceRange[1]
    );

    this.threeScene.render();
  }
}

if (window.autoInitDemo)
  window.demo = new ThreeSceneVideoDisplaceTextureDemo(document.body);
