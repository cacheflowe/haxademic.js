import DemoBase from "./demo--base.es6.js";
import FrameLoop from "../src/frame-loop.es6.js";
import ThreeScene from "../src/three-scene-.es6.js";
import ThreeScenePlane from "../src/three-scene-plane.es6.js";
import ThreeChromaShader from "../src/three-chroma-shader.es6.js";
import * as THREE from "../vendor/three/three.module.js";
import { EffectComposer } from "../vendor/three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "../vendor/three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "../vendor/three/examples/jsm/postprocessing/ShaderPass.js";
import { HorizontalBlurShader } from "../vendor/three/examples/jsm/shaders/HorizontalBlurShader.js";
import { VerticalBlurShader } from "../vendor/three/examples/jsm/shaders/VerticalBlurShader.js";

import VideoUtil from "../src/video-util.es6.js";

class ThreeScenePlaneDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "ThreeScenePlane",
      "three-scene-plane",
      "Video texture in a 2D plane FBO for post-processing effects"
    );
  }

  init() {
    // this.injectCSS(`body { background: #00bb00; }`);
    this.setupScene();
    this.buildVideoTexture();
    this.buildPostProcessing();
    this.startAnimation();
  }

  setupScene() {
    this.el = document.getElementById("three-scene-plane");
    this.threeScene = new ThreeScenePlane(768, 512, 0xff0000, true);
    this.el.appendChild(this.threeScene.canvasEl());
  }

  // THREE scene

  buildVideoTexture() {
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
    this.videoTexture.format = THREE.RGBAFormat;

    // set texture on FBO plane
    this.threeScene.setMaterial(
      new THREE.MeshBasicMaterial({
        map: this.videoTexture,
        color: 0xffffff,
        transparent: true,
      })
    );
  }

  buildPostProcessing() {
    this.composer = new EffectComposer(this.threeScene.getRenderer());
    this.composer.addPass(
      new RenderPass(this.threeScene.getScene(), this.threeScene.getCamera())
    );

    this.hblur = new ShaderPass(HorizontalBlurShader);
    this.hblur.uniforms.h.value = 0.002;
    this.composer.addPass(this.hblur);

    this.vblur = new ShaderPass(VerticalBlurShader);
    this.vblur.uniforms.v.value = 0.002;
    this.composer.addPass(this.vblur);

    this.chroma = new ShaderPass(ThreeChromaShader);
    this.chroma.material.transparent = true;
    this.composer.addPass(this.chroma);
    this.chroma.uniforms.thresholdSensitivity.value = 0.2;
    this.chroma.uniforms.smoothing.value = 0.7;
    this.chroma.uniforms.colorToReplace.value = new THREE.Color(0xffffff);

    this.chroma.renderToScreen = true;
  }

  startAnimation() {
    window._frameLoop = new FrameLoop().addListener(this);
  }

  frameLoop(frameCount) {
    // update low-res video texture
    // if(this.planeMaterial.displacementMap == this.canvasTexture) {
    //   this.canvasTexture.needsUpdate = true;
    // }

    // render!
    if (!!this.composer) {
      this.composer.render();
    } else {
      // this.threeScene.render();
    }
  }
}

if (window.autoInitDemo) window.demo = new ThreeScenePlaneDemo(document.body);
