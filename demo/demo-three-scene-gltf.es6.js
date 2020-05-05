class ThreeSceneGltfDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [
      "../vendor/three/three.min.js",
      "../vendor/three/GLTFLoader.js",
      "../src/pointer-pos.es6.js",
      "../src/three-scene-.es6.js",
    ], `
      <div class="container">
        <h1>ThreeScene glTF</h1>
        <div id="three-scene-gltf" style="width: 100%; height: 400px;"></div>
      </div>
    `);
  }

  init() {
    // setup
    this.el = document.getElementById('three-scene-gltf');
    this.pointerPos = new PointerPos();
    this.setupScene();
    this.buildCube();
    this.addShadow();
    this.startAnimation();
    this.loadModel();
  }

  setupScene() {
    this.threeScene = new ThreeScene(this.el, 0xffffff);
    this.scene = this.threeScene.getScene();
    this.camera = this.threeScene.getCamera();
    this.frameCount = 0;
  }

  startAnimation() {
    this.animate();
    window.addEventListener('resize', () => this.resize());
  }

  buildCube() {
    let cubeSize = 200;
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
    // this.scene.add(this.cubeMesh);
  }

  addShadow() {
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);
    var pointLight = new THREE.PointLight(0x444444, 1, 0);
    pointLight.position.set(-100, 100, 50);
    this.scene.add(pointLight);

		// add shadow plane
    var planeSize = 1000;
    this.floorY = -110;
		var plane = new THREE.Mesh(
			new THREE.PlaneBufferGeometry(planeSize, planeSize),
      new THREE.ShadowMaterial({ opacity: 0.5 })
		);
		plane.rotation.x = -Math.PI/2;
		plane.position.set(0, this.floorY, 0);
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

  loadModel() {
    // Instantiate a GLTF loader
    var loader = new GLTFLoader();
    loader.load(
      // resource URL
      '../data/duck.gltf',
      // called when the resource is loaded
      (gltf) => {
        // add gltf model to scene - extract specific child of gltf scene to add to our ThreeScene
        this.model = gltf.scene.children[0].children[1];
        this.model.castShadow = true;
        this.model.receiveShadow = true;
        this.model.material.wireframe = true;

        // calc scale
        var modelSize = this.model.geometry.boundingBox.min.sub(this.model.geometry.boundingBox.max);
        modelSize.set(Math.abs(modelSize.x), Math.abs(modelSize.y), Math.abs(modelSize.z));
        this.modelH = 200;
        this.baseScale = (1 / modelSize.y) * this.modelH; // normalize to 1 and scale to size in AR world
        this.model.scale.set(this.baseScale, this.baseScale ,this.baseScale);

        // set position
        this.model.position.set(this.model.position.x, this.model.position.y + this.floorY, this.model.position.z);

        // add model to scene
        this.scene.add(this.model);
        console.log(this.model);

        // gltf.animations; // Array<THREE.AnimationClip>
        // gltf.scene; // THREE.Group
        // gltf.scenes; // Array<THREE.Group>
        // gltf.cameras; // Array<THREE.Camera>
        // gltf.asset; // Object
      },
      // called while loading is progressing
      (xhr) => {
        console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
      },
      // called when loading has errors
      (error) => {
        console.log( 'GLTF load error' , error);
      }
    );
  }

  updateObjects() {
    // cube
    this.cubeMesh.rotation.y += 0.01;
    this.cubeMesh.rotation.x += 0.01;
    if(this.materialCube.map) this.materialCube.map.needsUpdate = true;
    if(this.model) this.model.rotation.y += 0.01;
    // lighthelper
    // if(this.lightHelper) this.lightHelper.update();
    // this.spotlight.position.y = this.pointerPos.y() * 10;
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

if(window.autoInitDemo) window.demo = new ThreeSceneGltfDemo(document.body);
