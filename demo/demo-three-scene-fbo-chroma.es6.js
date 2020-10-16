class ThreeSceneFBODemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [
      "../vendor/three/three.min.js",
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
        <div id="three-scene-fbo-chroma" style="width: 100%; height: 600px;"></div>
        <div id="video-debug"></div>
      </div>
    `);
  }

  init() {
    this.setupScene();
    this.buildBgMesh();
    this.buildVideoTexture();
    this.buildVideoMesh();
    this.setupInput();
    this.startAnimation();
    this.setupDragDrop();
  }

  setupScene() {
    this.el = document.getElementById('three-scene-fbo-chroma');
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

  buildBgMesh() {
    // build shape
    this.planeBg = new THREE.Mesh(
      new THREE.PlaneGeometry(1920/4, 1080/4),
      new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        side: THREE.FrontSide,  // DoubleSide
        wireframe: false,
      })
    );
    this.scene.add(this.planeBg);
  }

  buildVideoMesh() {
    // build shape
    let planeResolution = 1;
    this.planeGeometry = new THREE.PlaneGeometry(400*0.5, 320*0.5, planeResolution, planeResolution);
    this.planeMaterial = new THREE.ShaderMaterial({
      side: THREE.FrontSide,
      vertexShader: THREE.ChromaShader.vertexShader,
      fragmentShader: THREE.ChromaShader.fragmentShader,
      transparent: true,
      uniforms: {
        map: { value: this.threeFBO.getRenderTargetTexture() },
        thresholdSensitivity: { value: 0.2 },
        smoothing: { value: 0.8 },
        colorToReplace: { value: new THREE.Color( 0x000000 ) }
      }
    });
    this.plane = new THREE.Mesh( this.planeGeometry, this.planeMaterial );
    this.plane.position.set(0, 0, 25);
    this.scene.add(this.plane);
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
    this.videoTexture.format = THREE.RGBAFormat;  // THREE.RGBFormat?

    // set texture on FBO plane
    this.threeFBO.setMaterial(new THREE.MeshBasicMaterial({
      map: this.videoTexture,
      color: 0xffffff,
      transparent: true,
    }));
  }

  startAnimation() {
    window._frameLoop = (new FrameLoop()).addListener(this);
  }

  frameLoop(frameCount) {
    // update camera
    this.planeBg.rotation.y = this.plane.rotation.y = -0.5 + 1.0 * this.pointerPos.xNorm(this.el);
    this.planeBg.rotation.x = this.plane.rotation.x = -0.5 + 1.0 * this.pointerPos.yNorm(this.el);

    // render FBO and then main scene
    this.threeFBO.render(this.threeScene.getRenderer());
    this.threeScene.render();
  }

}

if(window.autoInitDemo) window.demo = new ThreeSceneFBODemo(document.body);
