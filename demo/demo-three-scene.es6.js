class ThreeSceneDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [
      "../vendor/three/three.min.js",
      "../src/mobile-util.es6.js",
      "../src/pointer-pos.es6.js",
      "../src/three-scene-.es6.js",
    ], `
      <div class="container">
        <h1>ThreeScene</h1>
        <div id="three-scene" style="width: 100%; height: 500px;"></div>
      </div>
    `);
  }

  init() {
    // setup
    this.el = document.getElementById('three-scene');
    this.setupInput();
    this.setupScene();
    this.buildCube();
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
    this.frameCount = 0;
    this.animate();
    window.addEventListener('resize', () => this.resize());
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 400);
  }

  buildCube() {
    let cubeSize = 150;
    this.materialCube = new THREE.MeshPhongMaterial({
      color: 0x00ffbb, // 0x00ffbb
      emissive : 0x000000, // 0x000000
      specular : 0x666666,
      shininess : 10,
      flatShading : false
    });

    this.cubeMesh = new THREE.Mesh(new THREE.BoxBufferGeometry(cubeSize, cubeSize * 0.4, cubeSize * 0.4), this.materialCube);
    this.cubeMesh.castShadow = true;
    this.cubeMesh.position.set(0, 30, 0);
    this.scene.add(this.cubeMesh);
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
    plane.rotation.x = -Math.PI/2;
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

    // add light helper
    var spotlightDebug = false;
    if(spotlightDebug == true) {
      this.lightHelper = new THREE.SpotLightHelper( this.spotlight );
      this.scene.add(this.lightHelper);
    }
  }

  updateObjects() {
    // cube
    this.cubeMesh.rotation.y = -1 + 2 * this.pointerPos.xPercent(this.el);
    this.cubeMesh.rotation.x = -1 + 2 * this.pointerPos.yPercent(this.el);
    if(this.materialCube.map) this.materialCube.map.needsUpdate = true;
    // lighthelper
    // if(this.lightHelper) this.lightHelper.update();
    // this.spotlight.position.y = this.pointerPos.y() * 10;
  }

  animate() {
    this.updateObjects();
    this.checkPixiTexture();
    this.threeScene.render();
    this.frameCount++;
    requestAnimationFrame(() => this.animate());
  }

  checkPixiTexture() {
    // lazy create texture map from PIXI demo
    if(window.pixiStage && this.textureMapInited != true) {
      this.textureMapInited = true;
      // set static size of PIXI stage to avoid THREE continuoulsy converting it to power-of-two size
      pixiStage.el.style.width = '512px';
      pixiStage.el.style.height = '256px';
      window.dispatchEvent(new Event('resize'));  // force PIXI to pick up stage size change
      // add map to material
      this.materialCube.map = new THREE.CanvasTexture(pixiStage.canvas());
    }
  }

  resize() {
    this.threeScene.resize();
  }

}

if(window.autoInitDemo) new ThreeSceneDemo(document.body);
