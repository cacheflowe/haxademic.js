/////////////////////////////////////////////
// DOM tests
/////////////////////////////////////////////

// demo class
class ThreeSceneArDemo {

  constructor() {
    this.setupScene();
    this.loadModel();
    this.startAnimation();
  }

  setupScene() {
    let webcamMode = !!document.location.href.match('mode=webcam');
    this.threeScene = new ThreeSceneAr(document.body, {
      cameraSource: webcamMode ? ThreeSceneAr.WEBCAM : '../vendor/ar.js/data/hiro-environment-test.jpg',
      arCameraData: '../vendor/ar.js/data/camera_para.dat',
      arMarkerPatt: '../vendor/ar.js/data/hiro.patt',
      markerActiveCallback: this.arActive.bind(this),
      lighting: {
        ambientColor: 0xcccccc,
        ambientIntensity: 0.65,
        lightHemiSkyColor: 0xffffff,
        lightHemiGroundColor: 0xffffff,
        lightHemiIntensity: 0.65,
        lightDirectionalColor: 0xaaaaaa,
        lightDirectionalIntensity: 0.5,
        lightDirectionalX: 2,
        lightDirectionalY: 3,
        lightDirectionalZ: 1,
        shadowPlaneSize: 15,
        shadowOpacity: 0.5,
        shadowSpotlightAngle: 0.5,
        shadowMapSize: 1024,
        shadowLightX: 1,
        shadowLightY: 12,
        shadowLightZ: 1,
      }
    }, false);
    this.scene = this.threeScene.getScene();
    this.arRoot = this.threeScene.getArRoot();
    this.camera = this.threeScene.getCamera();
    this.frameCount = 0;
  }

  arActive(isActive) {
    // set lerping scale here?
    // TODO: we need a 'willHide' type event to shrink
    if(isActive) {
      this.scale.setValue(0);
      this.scale.setTarget(1);
    } else {
      this.scale.setTarget(0);
    }
    // console.log('ThreeSceneArDemo.arActive()', isActive);
  }

  startAnimation() {
    this.animate();
    window.addEventListener('resize', () => this.resize());
  }

  loadModel() {
    this.scale = new LinearFloat(0, 0.025);
    this.baseScale = 0.001;
    // Instantiate a GLTF loader
    var loader = new GLTFLoader();
    loader.load(
      // resource URL
      // '../data/BBall_Test.gltf',
      '../data/HiPoly_MarbleIMGtexture_2.gltf',
      // called when the resource is loaded
      (gltf) => {
        // add gltf model to scene
        this.model = gltf.scene.children[0];
        this.model.castShadow = true;
        this.model.receiveShadow = true;
        this.model.scale.set(this.baseScale ,this.baseScale ,this.baseScale);
        // this.model.position.set(this.model.position.x, this.model.position.y, this.model.position.z);
        this.model.material.wireframe = false;
        var modelSize = this.model.geometry.boundingBox.min.sub(this.model.geometry.boundingBox.max);
        modelSize.set(Math.abs(modelSize.x), Math.abs(modelSize.y), Math.abs(modelSize.z));
        // this.model.geometry.translate(0, 70, 0);
        // this.model.verticesNeedUpdate = this.model.normalsNeedUpdate = this.model.colorsNeedUpdate = this.model.uvsNeedUpdate = this.model.groupsNeedUpdate = true;
        // debugger
        console.log('modelSize', modelSize);
        // debugger
        // this.model.material.
        this.arRoot.add(this.model);
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
    // model
    this.scale.update();
    let easedScale = Penner.easeInOutQuad(this.scale.value(), 0, 1, 1);
    let curScale = easedScale * this.baseScale;
    if(this.model) {
      this.model.scale.set(curScale, curScale, curScale);
      this.model.rotation.y += 0.01;
    }
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
new ThreeSceneArDemo();

/////////////////////////////////////////////
// Unit tests
/////////////////////////////////////////////
