class ThreeSceneDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [
      "../vendor/three/three.min.js",
      "../src/math-util.es6.js",
      "../src/pointer-pos.es6.js",
      "../src/three-scene-.es6.js",
    ], `
      <div class="container">
        <h1>ThreeScene</h1>
        <p>Custom textured shape w/UV & vertex displacement on the CPU</p>
        <div id="three-scene" style="width: 100%; height: 500px;"></div>
      </div>
    `);
  }

  init() {
    // setup
    this.el = document.getElementById('three-scene');
    this.pointerPos = new PointerPos();
    this.setupScene();
    this.addLights();
    this.buildCube();
    this.buildShape();
    this.startAnimation();
  }

  setupScene() {
    this.threeScene = new ThreeScene(this.el, 0xffdddd);
    this.scene = this.threeScene.getScene();
    this.camera = this.threeScene.getCamera();
  }

  addLights() {
    var ambientLight = new THREE.AmbientLight(0x999999, 0.8);
    this.scene.add(ambientLight);
    var pointLight = new THREE.PointLight(0x444444, 1, 0);
    pointLight.position.set(-100, 100, 50);
    // this.scene.add(pointLight);
    var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.95 );
    directionalLight.position.set(1, 0, 1); // default: (0, 1, 0);
    this.scene.add( directionalLight );
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
    let cubeSize = 100;
    this.materialCube = new THREE.MeshPhongMaterial({
      color: 0x00ffbb, // 0x00ffbb
      emissive : 0x000000, // 0x000000
      specular : 0x666666,
      shininess : 1,
      flatShading : false
    });

    this.cubeMesh = new THREE.Mesh(new THREE.BoxBufferGeometry(cubeSize, cubeSize, cubeSize), this.materialCube);
    this.cubeMesh.castShadow = true;
    this.cubeMesh.position.set(0, 0, 0);
    // this.scene.add(this.cubeMesh);
  }

  buildShape() {
    // build shape
    this.planeGeometry = new THREE.PlaneGeometry(2000, 260, 800, 1);
    this.planeGeometry = new THREE.CylinderGeometry(100, 100, 180, 200, 1, true);
    this.planeMaterial = new THREE.MeshPhongMaterial({
      color: 0x555555,
      side: THREE.DoubleSide,
      wireframe: false,
      emissive : 0x222222, // 0x000000
      specular : 0x333333,
      shininess : 10,
      // transparent: true,
      // opacity: 0.8,
    });
    this.plane = new THREE.Mesh( this.planeGeometry, this.planeMaterial );

    // load texture
    this.materialLoaded = false;
    let loader = new THREE.TextureLoader();
    let texture = loader.load(
      '../images/cacheflowe-logo-trans-white.png',
      (texture) => {  // load success
        // set texture repeat props
        this.textureZoom = {x: 1, y: 1};
        this.textureOffset = {x: 0, y: 0};
        this.textureRotation = 0;
        this.textureOffsetAmp = 0;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.center.set(0.5, 0.5);
        texture.repeat.set(this.textureZoom.x, this.textureZoom.y);
        // add material to geometry
        this.plane.material.map = texture;
        this.plane.material.map.needsUpdate = true;
        this.scene.add(this.plane);
        this.materialLoaded = true;
        // prep UV manipulation
        this.prepUVs();
      },
      undefined,    // no progress callback
      (error) => {  // load error
        console.log('Couldn\'t load plane texture!');
      }
    );
  }

  prepUVs() {
    // copy original & modified mesh data
    this.verticesCur = this.planeGeometry.vertices;
    this.verticesOrig = this.deepCopy(this.verticesCur);
    this.faceUVsCur = this.planeGeometry.faceVertexUvs[0];  // only one group of faces, so we use the first(?)
    this.faceUVsOrig = this.deepCopy(this.faceUVsCur);
  }

  updateUVs() {
    if(!this.materialLoaded) return;
    let texture = this.plane.material.map;

    // update offset amp & rotation
    this.textureOffsetAmp = 0.5 + 0.5 * Math.sin(this.frameCount/220);
    this.textureRotation = 0.3 * Math.sin(this.frameCount/220);

    // oscillate UVs & vertices
    this.faceUVsCur.forEach((faceUVs, i) => {
      // displace from original UVs
      let origFaceUVs = this.faceUVsOrig[i];
      faceUVs.forEach((vertexUV, j) => {
        let origVertUV = origFaceUVs[j];
        vertexUV.x = origVertUV.x + this.textureOffsetAmp * 0.05 * Math.sin(origVertUV.y * MathUtil.TWO_PI * 30. + this.frameCount/10);
        vertexUV.y = origVertUV.y + this.textureOffsetAmp * 0.1 * Math.sin(origVertUV.x * MathUtil.TWO_PI * 2. + this.frameCount/20);
      });
    });

    // oscillate vertices. this is lame
    this.verticesCur.forEach((vert, i) => {
      // displace from original vertices
      let origVert = this.verticesOrig[i];
      vert.z = origVert.z + 10. * Math.sin(origVert.x/40 + this.frameCount/10.);
      vert.y = origVert.y + 4. * Math.sin(i/100*MathUtil.TWO_PI*2 + this.frameCount/10.);
    });

    // update zoom
    this.textureZoom.x = 5;// 2 + 1. * Math.sin(this.frameCount/120);
    this.textureZoom.y = 3;// 4 + 1. * Math.sin(this.frameCount/50);

    // update offset
    this.textureOffset.x = this.frameCount/160; // + 0.1 * Math.sin(this.frameCount/10);
    // this.textureOffset.y = 0.1 * Math.sin(this.frameCount/20);

    // set texture props
    texture.offset.set(this.textureOffset.x, this.textureOffset.y);
    texture.repeat.set(this.textureZoom.x, this.textureZoom.y);
    // texture.rotation = this.textureRotation;
    // set dirty flags
    this.planeGeometry.uvsNeedUpdate = true;
    this.planeGeometry.verticesNeedUpdate = true;
  }

  deepCopy(obj) {
    let newObj = JSON.parse(JSON.stringify(obj));
    return newObj;
  }

  updateObjects() {
    // cube
    this.plane.rotation.y = this.cubeMesh.rotation.y = -0.5 + this.pointerPos.xPercent(this.el);
    this.plane.rotation.x = this.cubeMesh.rotation.x = -0.5 + this.pointerPos.yPercent(this.el);
    // if(this.materialCube.map) this.materialCube.map.needsUpdate = true;

    // update plane props
    this.updateUVs();
    // TODO plane:
    // - make UV coords to repeat pattern
    //   -
    // - update vertices CPU
    // - update vertices GPU
    // - Scrolling texture
    // - Texture remapping with wobbliness
  }

  animate() {
    this.updateObjects();
    this.threeScene.render();
    this.frameCount++;
    requestAnimationFrame(() => this.animate());
  }

  resize() {
    this.threeScene.resize();
  }

}

if(window.autoInitDemo) new ThreeSceneDemo(document.body);
