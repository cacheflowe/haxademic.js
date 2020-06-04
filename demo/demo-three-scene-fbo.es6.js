class ThreeSceneFBODemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [
      "../vendor/three/three.min.js",
      "../vendor/three/shaders/CopyShader.js",
      "../vendor/three/shaders/HorizontalBlurShader.js",
      "../vendor/three/shaders/VerticalBlurShader.js",
      "../vendor/three/postprocessing/EffectComposer.js",
      "../vendor/three/postprocessing/RenderPass.js",
      "../vendor/three/postprocessing/MaskPass.js",
      "../vendor/three/postprocessing/ShaderPass.js",
      "../src/drag-drop-util.es6.js",
      "../src/frame-loop.es6.js",
      "../src/mobile-util.es6.js",
      "../src/pointer-pos.es6.js",
      "../src/three-chroma-shader.es6.js",
      "../src/three-scene-.es6.js",
      "../src/three-scene-fbo.es6.js",
    ], `
      <div class="container">
        <style>
          .drop-over {
            outline: 10px dashed #009900;
          }
        </style>
        <h1>ThreeSceneFBO</h1>
        <div id="three-scene-fbo" style="width: 100%; height: 600px;"></div>
        <div id="video-debug"></div>
      </div>
    `);
  }

  init() {
    this.setupScene();
    this.buildImageMesh();
    this.buildVideoTexture();
    // this.buildPostProcessing();
    this.buildVideoMesh();
    this.setupInput();
    this.startAnimation();
    this.setupDragDrop();
  }

  setupScene() {
    this.el = document.getElementById('three-scene-fbo');
    this.threeScene = new ThreeScene(this.el, 0xff0000);
    this.threeScene.getRenderer().setClearColor(0x000000, 0);
    this.scene = this.threeScene.getScene();
    this.el.appendChild(this.threeScene.canvasEl());
    this.threeFBO = new ThreeSceneFBO(768, 768, 0xffffff);
  }

  setupInput() {
    this.pointerPos = new PointerPos();
    MobileUtil.lockTouchScreen(true);
    MobileUtil.disableTextSelect(document.body, true);
  }
  
  setupDragDrop() {
    DragDropUtil.dropFile(this.el, (fileResult) => {
      if(!!fileResult.match(/video/)) {
        this.videoEl.src = fileResult;
        this.videoEl.play();
      }
      if(!!fileResult.match(/image/)) {
        var loader = new THREE.TextureLoader();
        loader.load(fileResult,
          (texture) => {
            this.planeBg.material.map = texture;
            this.planeBg.material.needsUpdate = true; 
          },
          undefined,
          (err) => {
            console.error('An error happened.', err);
          }
        );
      }
    });
  }

  // THREE scene

  buildImageMesh() {
    // build shape
    this.planeBg = new THREE.Mesh(
      new THREE.PlaneGeometry(1920/2, 1080/2), 
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        wireframe: false,
      })
    );
    this.scene.add(this.planeBg);   
  }

  buildVideoMesh() {
    // build shape
    let planeResolution = 1;
    this.planeGeometry = new THREE.PlaneGeometry(320*0.5, 400*0.5, planeResolution, planeResolution);
    this.planeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      wireframe: false,
      map: this.threeFBO.getRenderTargetTexture(),
      blending: THREE.MultiplyBlending,  // use this if not using chroma shader postprocessing
      transparent: true,
    });
    this.plane = new THREE.Mesh( this.planeGeometry, this.planeMaterial );
    this.plane.position.set(0, 0, 25);
    this.planeBg.add(this.plane);
  }

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
    this.threeFBO.setMaterial(new THREE.MeshBasicMaterial({
      map: this.videoTexture,
      color: 0xffffff,
      transparent: true,
    }));
  }

  buildPostProcessing() {
    // set up effects chain on render buffer
    this.composer = new THREE.EffectComposer(this.threeScene.getRenderer(), this.threeFBO.getRenderTarget());
    this.composer.addPass(new THREE.RenderPass(this.threeFBO.getScene(), this.threeFBO.getCamera()));
    this.composer.renderToScreen = false;
    
    // add chroma filter
    // this requires the following renderer setting to properly set tranparency
    // this.threeScene.getRenderer().setClearColor(0x000000, 0);
    this.chroma = new THREE.ShaderPass( THREE.ChromaShader );
    this.chroma.material.transparent = true; 
    this.chroma.uniforms.thresholdSensitivity.value = 0.1;
    this.chroma.uniforms.smoothing.value = 0.9;
    this.chroma.uniforms.colorToReplace.value = new THREE.Color(0xffffff);
    this.composer.addPass(this.chroma);
  }

  startAnimation() {
    window._frameLoop = (new FrameLoop()).addListener(this);
  }

  frameLoop(frameCount) {
    // update camera
    this.planeBg.rotation.y = -0.5 + 1.0 * this.pointerPos.xNorm(this.el);
    this.planeBg.rotation.x = -0.5 + 1.0 * this.pointerPos.yNorm(this.el);
    
    // render!
    if(!!this.composer) {
      this.threeFBO.render(this.threeScene.getRenderer());
      this.composer.reset(this.threeFBO.getRenderTarget());   // needed fo chroma filter
      this.composer.render();
      this.threeScene.render();
    } else {
      this.threeFBO.render(this.threeScene.getRenderer());
      this.threeScene.render();
    }
  }

}

if(window.autoInitDemo) window.demo = new ThreeSceneFBODemo(document.body);
