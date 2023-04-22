import DemoBase from "./demo--base.es6.js";
import * as THREE from "../vendor/three/three.module.js";
import { ConvexGeometry } from "../vendor/three/examples/jsm/geometries/ConvexGeometry.js";
import ColorUtil from "../src/color-util.es6.js";
import FrameLoop from "../src/frame-loop.es6.js";
import MobileUtil from "../src/mobile-util.es6.js";
import PointerPos from "../src/pointer-pos.es6.js";
import ThreeScene from "../src/three-scene-.es6.js";

class ThreeSceneConvexHullDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "ThreeScene | ConvexHull",
      "three-scene-convex-hull",
      "ConvexHull geometry demo",
      true
    );
  }

  init() {
    // setup
    this.setupInput();
    this.setupScene();
    this.buildConvexHullShape();
    this.addShadow();
    this.startAnimation();
  }

  setupInput() {
    this.pointerPos = new PointerPos();
    MobileUtil.lockTouchScreen(true);
    MobileUtil.disableTextSelect(document.body, true);
  }

  setupScene() {
    this.threeScene = new ThreeScene(this.el, 0xffffff);
    this.scene = this.threeScene.getScene();
    this.camera = this.threeScene.getCamera();
  }

  startAnimation() {
    // do resize
    window.addEventListener("resize", () => this.resize());
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 400);
    // set up frame loop
    let frames = 200;
    // super.initRecording(this.threeScene.canvasEl(), frames, 1, 30);
    window._frameLoop = new FrameLoop(frames, 4).addListener(this);
  }

  frameLoop(frameCount) {
    this.updateObjects();
    this.threeScene.render();
    // super.renderVideo();
  }

  buildConvexHullShape() {
    // remove old mesh
    if (this.mesh) this.scene.remove(this.mesh);

    // build new mesh
    let max = 100.0;
    let points = [];
    for (var i = 0; i <= 15; i++) {
      points.push(
        new THREE.Vector3(
          Math.random() * max - max / 2,
          Math.random() * max - max / 2,
          Math.random() * max - max / 2
        )
      );
    }
    this.mesh = new THREE.Mesh(
      new ConvexGeometry(points),
      new THREE.MeshPhongMaterial({
        color: ColorUtil.randomColorHexInt(),
      })
    );
    this.mesh.castShadow = true;
    this.scene.add(this.mesh);
  }

  addShadow() {
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);
    var pointLight = new THREE.PointLight(0x444444, 1, 0);
    pointLight.position.set(-100, 100, 50);
    this.scene.add(pointLight);

    // add shadow plane
    var planeSize = 1000;
    var plane = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(planeSize, planeSize),
      new THREE.ShadowMaterial({ opacity: 0.5 })
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(0, -110, 0);
    plane.receiveShadow = true;
    this.scene.add(plane);

    // add shadow spotlight
    this.spotlight = new THREE.SpotLight(0xffffff);
    this.spotlight.position.set(0, 600, 0);
    this.spotlight.target = plane;
    this.spotlight.castShadow = true;
    this.spotlight.shadow.mapSize.width = 4096;
    this.spotlight.shadow.mapSize.height = 4096;
    // this.spotlight.shadow.camera.near = 500;
    // this.spotlight.shadow.camera.far = 4000;
    // this.spotlight.shadow.camera.fov = 30;
    this.spotlight.penumbra = 0.1;
    this.spotlight.decay = 2;
    this.spotlight.angle = 1;
    this.spotlight.distance = 1000;
    this.scene.add(this.spotlight);
  }

  updateObjects() {
    // make a new shape sometimes
    if (_frameLoop.getIsTick() && _frameLoop.getCurTick() == 0) {
      this.buildConvexHullShape();
    }
    // cube
    this.mesh.rotation.y = _frameLoop.getProgressRads();
    this.mesh.rotation.y += -1 + 2 * this.pointerPos.xNorm(this.el);
    this.mesh.rotation.x = -1 + 2 * this.pointerPos.yNorm(this.el);
  }

  resize() {
    this.threeScene.resize();
  }
}

if (window.autoInitDemo)
  window.demo = new ThreeSceneConvexHullDemo(document.body);
