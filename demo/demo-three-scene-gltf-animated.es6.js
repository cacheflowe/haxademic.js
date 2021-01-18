import DemoBase from './demo--base.es6.js';
import * as THREE from '../vendor/three/three.module.js';
import GLTFLoader from '../vendor/three/GLTFLoader.js';
import PointerPos from '../src/pointer-pos.es6.js';
import ThreeScene from '../src/three-scene-.es6.js';

class ThreeSceneGltfAnimatedDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [], `
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
    this.loadTexture();
    // this.loadModel();
  }

  setupScene() {
    this.threeScene = new ThreeScene(this.el, 0xffffff);
    this.scene = this.threeScene.getScene();
    this.camera = this.threeScene.getCamera();
    this.frameCount = 0;
    this.clock = new THREE.Clock();
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

  loadTexture() {
    this.materialLoaded = false;
    let loader = new THREE.TextureLoader();
    let texture = loader.load(
      '../data/maxim.png',
      (texture) => {  // load success
        this.texture = texture;
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
        // this.plane.material.map = texture;
        // this.plane.material.map.needsUpdate = true;
        // this.scene.add(this.plane);
        this.materialLoaded = true;
        // prep UV manipulation
        this.loadModel();
      },
      undefined,    // no progress callback
      (error) => {  // load error
        console.log('Couldn\'t load plane texture!');
      }
    );

  }

  loadModel() {
    // Instantiate a GLTF loader
    var loader = new GLTFLoader();
    loader.load(
      // resource URL
      '../data/Waffle_Shoe1.gltf',
      // called when the resource is loaded
      (gltf) => {
        // add gltf model to scene - extract specific child of gltf scene to add to our ThreeScene
        this.model = gltf.scene.children[0];
        this.model.castShadow = true;
        this.model.receiveShadow = true;
        // this.model.material.wireframe = true;

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
        // console.log(this.model);

        // replace texture if we want
        this.model.material = new THREE.MeshPhongMaterial({
          color: 0x555555,
          side: THREE.DoubleSide,
          wireframe: false,
          emissive : 0x555555, // 0x000000
          specular : 0x999999,
          shininess : 10,
          map: this.texture,
          skinning: true,
          morphTargets: true,
          // transparent: true,
          // opacity: 0.8,
        });
        this.texture.repeat.set(1, -1);

        // add animation if needed
        this.mixer = new THREE.AnimationMixer(this.model);
        this.mixer.clipAction(gltf.animations[0]).setDuration(1).play();

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

    // gltf animation
	  if(this.mixer) this.mixer.update(this.clock.getDelta());
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

if(window.autoInitDemo) window.demo = new ThreeSceneGltfAnimatedDemo(document.body);
