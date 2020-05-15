class ThreeSceneFBODemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [
      "../vendor/three/three.min.js",
      "http://mrdoob.github.com/three.js/examples/js/shaders/CopyShader.js",
      "http://mrdoob.github.com/three.js/examples/js/shaders/HorizontalBlurShader.js",
      "http://mrdoob.github.com/three.js/examples/js/shaders/VerticalBlurShader.js",
      "http://mrdoob.github.com/three.js/examples/js/postprocessing/EffectComposer.js",
      "http://mrdoob.github.com/three.js/examples/js/postprocessing/RenderPass.js",
      "http://mrdoob.github.com/three.js/examples/js/postprocessing/MaskPass.js",
      "http://mrdoob.github.com/three.js/examples/js/postprocessing/ShaderPass.js",
      "../src/frame-loop.es6.js",
      "../src/pointer-pos.es6.js",
      "../src/three-chroma-shader.es6.js",
      "../src/three-scene-fbo.es6.js",
    ], `
      <div class="container">
        <style>
          body {
            background: #00ff00;
          }
        </style>
        <h1>ThreeSceneFBO</h1>
        <div id="three-scene-fbo"></div>
        <div id="video-debug"></div>
      </div>
    `);
  }

  init() {
    this.setupScene();
    this.buildVideoTexture();
    this.buildPostProcessing();
    this.startAnimation();
  }

  setupScene() {
    this.el = document.getElementById('three-scene-fbo');
    this.threeScene = new ThreeSceneFBO(256, 256, 0xff0000, true);
    this.el.appendChild(this.threeScene.canvasEl());
  }

  // THREE scene

  buildVideoTexture() {
    // setup
    this.videoDebugEl = document.getElementById('video-debug');

    // add video element
    this.videoEl = document.createElement('video');
    this.videoEl.src = '../data/wash-your-hands-512.mp4';
    this.videoEl.style.setProperty('width', '320px');
    this.videoEl.setAttribute('loop', 'true');
    this.videoEl.setAttribute('muted', 'true');
    this.videoEl.setAttribute('playsinline', 'true');
    this.videoEl.setAttribute('preload', 'auto');
    this.videoEl.setAttribute('crossOrigin', 'anonymous');
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
    this.threeScene.setMaterial(new THREE.MeshBasicMaterial({
      map: this.videoTexture,
      color: 0xffffff,
      transparent: true,
    }));
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
    this.composer.addPass(new THREE.RenderPass(this.threeScene.getScene(), this.threeScene.getCamera()));

    this.hblur = new THREE.ShaderPass( THREE.HorizontalBlurShader );
    this.hblur.uniforms.h.value = 0.005;
    // this.composer.addPass(this.hblur);

    this.vblur = new THREE.ShaderPass( THREE.VerticalBlurShader );
    this.vblur.uniforms.v.value = 0.005;
    // this.composer.addPass(this.vblur);
    
    this.chroma = new THREE.ShaderPass( THREE.ChromaShader );
    this.chroma.material.transparent = true; 
    this.composer.addPass(this.chroma);
    this.chroma.uniforms.thresholdSensitivity.value = 0.2;
    this.chroma.uniforms.smoothing.value = 0.7;
    this.chroma.uniforms.colorToReplace.value = new THREE.Color(0xffffff);

    this.chroma.renderToScreen = true;
  }

  startAnimation() {
    window._frameLoop = (new FrameLoop()).addListener(this);
  }

  frameLoop(frameCount) {
    // update low-res video texture
    // if(this.planeMaterial.displacementMap == this.canvasTexture) {
    //   this.canvasTexture.needsUpdate = true;
    // }
    
    // render!
    if(!!this.composer) {
      this.composer.render();
    } else {
      // this.threeScene.render();
    }
  }

}

if(window.autoInitDemo) window.demo = new ThreeSceneFBODemo(document.body);
