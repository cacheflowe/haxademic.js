class ThreeSceneVideoTextureDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [
      "../vendor/guify.min.js",
      "../vendor/three/three.min.js",
      "../src/drag-drop-util.es6.js",
      "../src/frame-loop.es6.js",
      // "../src/math-util.es6.js",
      "../src/mobile-util.es6.js",
      "../src/pointer-pos.es6.js",
      "../src/three-scene-.es6.js",
      "../src/ui-control-panel.es6.js",
    ], `
      <div class="container">
        <style>
          .drop-over {
            outline: 10px dashed #009900;
          }
        </style>
        <h1>ThreeScene | Video Texture</h1>
        <div id="three-scene" style="width: 100%; height: 0; padding-bottom: 100%;"></div>
        <div id="video-debug"></div>
      </div>
    `);
  }

  init() {
    this.setupScene();
    this.addLights();
    this.createVideoCanvas();
    this.createDisplacementMap();
    this.buildVideoMesh();
    this.startAnimation();
    this.setupInput();
    this.setupUI();
    this.setupDragDrop();
  }

  setupScene() {
    this.el = document.getElementById('three-scene');
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
    _ui.addSliderRange('DisplacementRange', 'displaceRange', [-50,50], -200, 200);
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

    var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
    directionalLight.position.set(0.3, 0, 1); // default: (0, 1, 0);
    this.scene.add( directionalLight );

    var pointLight = new THREE.PointLight(0xffffff, 3, 500, 2);
    pointLight.position.set(0, 0, 300);
    this.scene.add(pointLight);
  }

  buildVideoMesh() {
    // setup
    this.videoDebugEl = document.getElementById('video-debug');

    // add video element
    this.videoEl = document.createElement('video');
    this.videoEl.src = '../data/wash-your-hands-512.mp4';
    this.videoEl.setAttribute('loop', 'true');
    this.videoEl.setAttribute('muted', 'true');
    this.videoEl.setAttribute('playsinline', 'true');
    this.videoEl.setAttribute('preload', 'auto');
    this.videoEl.setAttribute('crossOrigin', 'anonymous');
    this.videoEl.defaultMuted = true;
    this.videoEl.muted = true;
    this.videoEl.play();
    this.videoEl.style.setProperty('width', '320px');   // for debug view
    this.videoEl.style.setProperty('border', '1px solid #090');
    this.videoDebugEl.appendChild(this.videoEl);
    // this.videoEl.volume = 0;

    // add THREE video texture
    /*
    this.videoTexture = new THREE.VideoTexture(this.videoEl);
    this.videoTexture.minFilter = THREE.LinearFilter;
    this.videoTexture.magFilter = THREE.LinearFilter;
    this.videoTexture.format = THREE.RGBFormat;
    this.videoTexture.repeat.set(0.5, 1);
    // console.log(this.videoTexture);

    // add THREE video texture
    this.videoDisplaceTex = new THREE.VideoTexture(this.videoEl);
    this.videoDisplaceTex.minFilter = THREE.LinearFilter;
    this.videoDisplaceTex.magFilter = THREE.LinearFilter;
    this.videoDisplaceTex.format = THREE.RGBFormat;
    this.videoDisplaceTex.repeat.set(0.5, 1);
    this.videoDisplaceTex.offset.set(0.5, 0);
    */

    // build shape
    let planeResolution = 200;
    this.planeGeometry = new THREE.PlaneGeometry(175, 250, planeResolution, planeResolution);
    this.planeMaterial = new THREE.MeshPhongMaterial({
      color: 0x555555,
      side: THREE.DoubleSide,
      wireframe: false,
      emissive : 0x222222, // 0x000000
      specular : 0x333333,
      shininess : 10,
      map: this.canvasTexture,
      // map: this.videoTexture,
      // normalMap: this.videoTexture,
      // displacementMap: this.videoDisplaceTex, // this.canvasTexture
      displacementMap: this.canvasDispTexture,
      displacementScale: 50,
    });
    this.plane = new THREE.Mesh( this.planeGeometry, this.planeMaterial );
    this.scene.add(this.plane);
  }

  createVideoCanvas() {
    // create canvas
		this.canvasTex = document.createElement('canvas');
    this.canvasTex.setAttribute('width', '256');
    this.canvasTex.setAttribute('height', '512');
		this.ctx = this.canvasTex.getContext('2d');

    // create THREE texture from canvas
    this.canvasTexture = new THREE.Texture(this.canvasTex);
    // this.canvasTexture.repeat.set(0.25, 1);
    this.canvasTexture.needsUpdate = true;

    // debug
    setTimeout(() => {
      // this.videoDebugEl.appendChild(this.canvasTex);
    }, 200);
  }

  createDisplacementMap() {
    // create canvas
		this.canvasMap = document.createElement('canvas');
    this.canvasMap.setAttribute('width', '256');
    this.canvasMap.setAttribute('height', '512');
		this.ctxDisp = this.canvasMap.getContext('2d');

    // create THREE texture from canvas
    this.canvasDispTexture = new THREE.Texture(this.canvasMap);
    // this.canvasDispTexture.repeat.set(1, 1);
    this.canvasDispTexture.needsUpdate = true;

    // debug
    setTimeout(() => {
      // this.videoDebugEl.appendChild(this.canvasMap);
    }, 200);
  }


  startAnimation() {
    window._frameLoop = (new FrameLoop()).addListener(this);
  }

  frameLoop(frameCount) {
    // update low-res video texture
    if(this.planeMaterial.map == this.canvasTexture) {
      // this.ctx.filter = 'grayscale(100%) blur(2px)';
      // this.ctx.globalAlpha = 0.5;
      // this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.drawImage(    this.videoEl,    0, 0, 512, this.canvasTex.height);
      this.ctxDisp.drawImage(this.videoEl, -256, 0, 512, this.canvasMap.height);
      this.canvasTexture.needsUpdate = true;
      this.canvasDispTexture.needsUpdate = true;
    }

    // update camera
    this.plane.rotation.y = -1 + 2 * this.pointerPos.xNorm(this.el);
    this.plane.rotation.x = -1 + 2 * this.pointerPos.yNorm(this.el);

    // update displacement
    let displaceRange = _ui.value('displaceRange');
    this.planeMaterial.displacementScale = _frameLoop.osc(0.03, displaceRange[0], displaceRange[1]);
    
    this.threeScene.render();
  }

}

if(window.autoInitDemo) window.demo = new ThreeSceneVideoTextureDemo(document.body);
