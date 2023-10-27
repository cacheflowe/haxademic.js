import DemoBase from "./demo--base.js";
import * as THREE from "../vendor/three/three.module.js";
import DragDropUtil from "../src/drag-drop-util.js";
import FrameLoop from "../src/frame-loop.js";
import MobileUtil from "../src/mobile-util.js";
import PointerPos from "../src/pointer-pos.js";
import ThreeScene from "../src/three-scene-.js";
import ThreeSceneFBO from "../src/three-scene-fbo.js";
import ThreeChromaShader from "../src/three-chroma-shader.js";
import VideoUtil from "../src/video-util.js";

class ThreeSceneFBODemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "ThreeSceneFBO",
      "three-scene-fbo",
      "Video texture in an FBO for post-processing effects"
    );
  }

  init() {
    this.addDropOverCSS();
    this.setupScene();
    this.buildBgMesh();
    this.buildVideoTexture();
    this.buildVideoMesh();
    this.setupInput();
    this.startAnimation();
    this.setupDragDrop();
    this.addDropOverCSS();
  }

  setupScene() {
    this.el.setAttribute("style", "height: 500px;");
    this.threeScene = new ThreeScene(this.el, 0xff0000);
    this.threeScene.getRenderer().setClearColor(0xff0000, 0);
    this.scene = this.threeScene.getScene();
    this.threeFBO = new ThreeSceneFBO(768, 768, 0x00ffff);
  }

  setupInput() {
    this.pointerPos = new PointerPos();
    MobileUtil.lockTouchScreen(true);
    MobileUtil.disableTextSelect(document.body, true);
  }

  setupDragDrop() {
    DragDropUtil.dropFile(this.el, (fileResult) => {
      if (!!fileResult.match(/video/)) {
        this.videoEl.src = fileResult;
        this.videoEl.play();
      }
      if (!!fileResult.match(/image/)) {
        var loader = new THREE.TextureLoader();
        loader.load(
          fileResult,
          (texture) => {
            this.planeBg.material.map = texture;
            this.planeBg.material.needsUpdate = true;
          },
          undefined,
          (err) => {
            console.error("An error happened.", err);
          }
        );
      }
    });
  }

  // THREE scene

  buildBgMesh() {
    // build shape
    this.planeBg = new THREE.Mesh(
      new THREE.PlaneGeometry(1920 / 4, 1080 / 4),
      new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        side: THREE.FrontSide, // DoubleSide
        wireframe: false,
      })
    );
    this.scene.add(this.planeBg);
  }

  buildVideoMesh() {
    // build shape
    let planeResolution = 1;
    this.planeGeometry = new THREE.PlaneGeometry(
      400 * 0.5,
      320 * 0.5,
      planeResolution,
      planeResolution
    );
    this.planeMaterial = new THREE.ShaderMaterial({
      side: THREE.FrontSide,
      vertexShader: ThreeChromaShader.vertexShader,
      fragmentShader: ThreeChromaShader.fragmentShader,
      transparent: true,
      uniforms: {
        tDiffuse: { value: this.threeFBO.getTexture() },
        thresholdSensitivity: { value: 0.2 },
        smoothing: { value: 0.8 },
        colorToReplace: { value: new THREE.Color(0x000000) },
      },
    });
    this.plane = new THREE.Mesh(this.planeGeometry, this.planeMaterial);
    this.plane.position.set(0, 0, 25);
    this.scene.add(this.plane);
  }

  buildVideoTexture() {
    // add video element
    let videoPath = "../data/videos/wash-your-hands.mp4";
    this.videoEl = VideoUtil.buildVideoEl(videoPath, true);
    this.videoEl.style.setProperty("width", "320px");
    this.debugEl.appendChild(this.videoEl);

    // add THREE video texture
    this.videoTexture = new THREE.VideoTexture(this.videoEl);
    this.videoTexture.minFilter = THREE.LinearFilter;
    this.videoTexture.magFilter = THREE.LinearFilter;
    this.videoTexture.format = THREE.RGBAFormat; // THREE.RGBFormat?

    // set texture on FBO plane
    this.threeFBO.setMaterial(
      new THREE.MeshBasicMaterial({
        map: this.videoTexture,
        color: 0xffffff,
        transparent: true,
      })
    );
  }

  startAnimation() {
    window._frameLoop = new FrameLoop().addListener(this);
  }

  frameLoop(frameCount) {
    // update camera
    this.planeBg.rotation.y = this.plane.rotation.y =
      -0.5 + 1.0 * this.pointerPos.xNorm(this.el);
    this.planeBg.rotation.x = this.plane.rotation.x =
      -0.5 + 1.0 * this.pointerPos.yNorm(this.el);

    // render FBO and then main scene
    this.threeFBO.render(this.threeScene.getRenderer());
    this.threeScene.render();
  }
}

if (window.autoInitDemo) window.demo = new ThreeSceneFBODemo(document.body);
