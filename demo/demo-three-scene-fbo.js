import DemoBase from "./demo--base.js";
import DragDropUtil from "../src/drag-drop-util.js";
import FrameLoop from "../src/frame-loop.js";
import MobileUtil from "../src/mobile-util.js";
import PointerPos from "../src/pointer-pos.js";
import ThreeScene from "../src/three-scene-.js";
import ThreeSceneFBO from "../src/three-scene-fbo.js";
import ThreeChromaShader from "../src/three-chroma-shader.js";
import VideoUtil from "../src/video-util.js";
import * as THREE from "../vendor/three/three.module.js";
import { EffectComposer } from "../vendor/three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "../vendor/three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "../vendor/three/examples/jsm/postprocessing/ShaderPass.js";

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
    this.buildImageMesh();
    this.buildVideoTexture();
    this.buildPostProcessing();
    this.buildVideoMesh();
    this.setupInput();
    this.startAnimation();
    this.setupDragDrop();
    this.addDropOverCSS();
  }

  setupScene() {
    this.el.setAttribute("style", "height: 600px;");
    this.threeScene = new ThreeScene(this.el, 0xff0000);
    this.threeScene.getRenderer().setClearColor(0xff0000, 0);
    this.scene = this.threeScene.getScene();
    this.el.appendChild(this.threeScene.canvasEl());
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

  buildImageMesh() {
    // build shape
    this.planeBg = new THREE.Mesh(
      new THREE.PlaneGeometry(1920 / 4, 1080 / 3),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
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
    this.planeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      wireframe: false,
      map: this.threeFBO.getTexture(),
      blending: THREE.MultiplyBlending, // use this if not using chroma shader postprocessing
      transparent: true,
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

  buildPostProcessing() {
    // set up effects chain on render buffer
    this.composer = new EffectComposer(
      this.threeScene.getRenderer(),
      this.threeFBO.getRenderTarget()
    );
    // this.composer = new EffectComposer(this.threeScene.getRenderer());
    this.composer.addPass(
      new RenderPass(this.threeFBO.getScene(), this.threeFBO.getCamera())
    );
    this.composer.renderToScreen = false;

    // add chroma filter
    this.chroma = new ShaderPass(ThreeChromaShader);
    this.chroma.material.transparent = true;
    this.chroma.uniforms.thresholdSensitivity.value = 0.1;
    this.chroma.uniforms.smoothing.value = 0.9;
    this.chroma.uniforms.colorToReplace.value = new THREE.Color(0xffffff);
    this.chroma.uniforms.tDiffuse.value =
      this.threeFBO.getRenderTarget().texture;
    this.composer.addPass(this.chroma);
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

    // render!
    if (!!this.composer) {
      // render FBO without effects
      // this.threeFBO.render(this.threeScene.getRenderer());
      // this.composer.reset(this.threeFBO.getRenderTarget());   // needed for chroma filter

      // render FBO with effects
      this.threeScene.getRenderer().setClearColor(0xff0000, 1);
      this.composer.reset(this.threeFBO.getRenderTarget()); // needed for chroma filter
      this.composer.render();
      this.threeScene.render();
    } else {
      this.threeFBO.render(this.threeScene.getRenderer());
      this.threeScene.render();
    }
  }
}

if (window.autoInitDemo) window.demo = new ThreeSceneFBODemo(document.body);
