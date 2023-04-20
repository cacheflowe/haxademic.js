import DemoBase from "./demo--base.es6.js";
import FrameLoop from "../src/frame-loop.es6.js";
import ThreeScene from "../src/three-scene-.es6.js";
import ThreeScenePlane from "../src/three-scene-plane.es6.js";
import ThreeChromaShader from "../src/three-chroma-shader.es6.js";

class ThreeScenePlaneDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [
        "!../vendor/three/three.min.js",
        "!../vendor/three/shaders/CopyShader.js",
        "!../vendor/three/shaders/HorizontalBlurShader.js",
        "!../vendor/three/shaders/VerticalBlurShader.js",
        "!../vendor/three/postprocessing/EffectComposer.js",
        "!../vendor/three/postprocessing/RenderPass.js",
        "!../vendor/three/postprocessing/MaskPass.js",
        "!../vendor/three/postprocessing/ShaderPass.js",
      ],
      `
      <div class="container">
        <style>
          body {
            background: #00ff00;
          }
        </style>
        <h1>ThreeScenePlane</h1>
        <div id="three-scene-plane"></div>
        <div id="video-debug"></div>
      </div>
    `
    );
  }

  init() {
    this.setupScene();
    this.buildVideoTexture();
    this.buildPostProcessing();
    this.startAnimation();
  }

  setupScene() {
    this.el = document.getElementById("three-scene-plane");
    this.threeScene = new ThreeScenePlane(256, 256, 0xff0000, true);
    this.el.appendChild(this.threeScene.canvasEl());
  }

  // THREE scene

  buildVideoTexture() {
    // setup
    this.videoDebugEl = document.getElementById("video-debug");

    // add video element
    this.videoEl = document.createElement("video");
    this.videoEl.src = "../data/videos/wash-your-hands-512.mp4";
    this.videoEl.style.setProperty("width", "320px");
    this.videoEl.setAttribute("loop", "true");
    this.videoEl.setAttribute("muted", "true");
    this.videoEl.setAttribute("playsinline", "true");
    this.videoEl.setAttribute("preload", "auto");
    this.videoEl.setAttribute("crossOrigin", "anonymous");
    this.videoEl.defaultMuted = true;
    this.videoEl.muted = true;
    this.videoEl.play();
    this.videoDebugEl.appendChild(this.videoEl);
    // this.videoEl.volume = 0;

    // add THREE video texture
    this.videoTexture = new THREE.VideoTexture(this.videoEl);
    this.videoTexture.minFilter = THREE.LinearFilter;
    this.videoTexture.magFilter = THREE.LinearFilter;
    this.videoTexture.format = THREE.RGBFormat;

    // set texture on FBO plane
    this.threeScene.setMaterial(
      new THREE.MeshBasicMaterial({
        map: this.videoTexture,
        color: 0xffffff,
        transparent: true,
      })
    );
  }

  // createDisplacementMap() {
  //   // create canvas
  // 	this.canvasMap = document.createElement('canvas');
  //   this.canvasMap.setAttribute('width', '512');
  //   this.canvasMap.setAttribute('height', '512');
  // 	this.ctx = this.canvasMap.getContext('2d');
  //   setTimeout(() => {
  //     this.videoDebugEl.appendChild(this.canvasMap);
  //   }, 200);

  //   // create THREE texture from canvas
  //   this.canvasTexture = new THREE.Texture(this.canvasMap);
  //   this.canvasTexture.needsUpdate = true;
  // }

  buildPostProcessing() {
    this.composer = new THREE.EffectComposer(this.threeScene.getRenderer());
    this.composer.addPass(
      new THREE.RenderPass(
        this.threeScene.getScene(),
        this.threeScene.getCamera()
      )
    );

    this.hblur = new THREE.ShaderPass(THREE.HorizontalBlurShader);
    this.hblur.uniforms.h.value = 0.005;
    // this.composer.addPass(this.hblur);

    this.vblur = new THREE.ShaderPass(THREE.VerticalBlurShader);
    this.vblur.uniforms.v.value = 0.005;
    // this.composer.addPass(this.vblur);

    this.chroma = new THREE.ShaderPass(ThreeChromaShader);
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
