import DemoBase from "./demo--base.js";
import DOMUtil from "../src/dom-util.js";
import LinearFloat from "../src/linear-float.js";
import Penner from "../src/penner.js";
import PointerPos from "../src/pointer-pos.js";
import ThreeScene from "../src/three-scene-.js";
import { GLTFLoader } from "../vendor/three/GLTFLoader.js";
import ThreeSceneAr from "../src/three-scene-ar.js";

class ThreeSceneArDemo extends DemoBase {
  // TODO
  // - Things broke with the new THREE.js version.
  // - This reveal a problem of double-loading THREE
  // - https://discourse.threejs.org/t/uncaught-typeerror-material-onbuild-is-not-a-function/26071

  constructor(parentEl) {
    super(parentEl, [
      "!../vendor/three/three.min.js",
      // "!../vendor/three/GLTFLoader_NonModule.js",
      "!../vendor/ar.js/jsartoolkit5/artoolkit.min.js",
      "!../vendor/ar.js/jsartoolkit5/artoolkit.api.js",
      "!../vendor/ar.js/threex/threex-artoolkitsource.js",
      "!../vendor/ar.js/threex/threex-artoolkitcontext.js",
      "!../vendor/ar.js/threex/threex-arbasecontrols.js",
      "!../vendor/ar.js/threex/threex-armarkercontrols.js",
      "!../vendor/ar.js/threex/threex-arsmoothedcontrols.js",
    ]);
  }

  init() {
    // setup
    document.body.setAttribute(
      "style",
      "height: 100vh; margin : 0px; overflow: hidden"
    );
    this.setupScene();
    this.loadModel();
    this.startAnimation();
  }

  setupScene() {
    let webcamMode = !!document.location.href.match("mode=webcam");
    this.threeScene = new ThreeSceneAr(
      document.body,
      {
        cameraSource: webcamMode
          ? ThreeSceneAr.WEBCAM
          : "../vendor/ar.js/data/hiro-environment-test.jpg",
        arCameraData: "../vendor/ar.js/data/camera_para.dat",
        arMarkerPatt: "../vendor/ar.js/data/hiro.patt",
        sourceReadyCallback: this.arSourceReady.bind(this),
        sourceErrorCallback: this.arSourceError.bind(this),
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
        },
      },
      true
    );
    this.scene = this.threeScene.getScene();
    this.arRoot = this.threeScene.getArRoot();
    this.camera = this.threeScene.getCamera();
    this.frameCount = 0;
  }

  // callbacks

  arSourceReady() {
    console.log("ThreeSceneAR source ready!");
  }

  arSourceError() {
    console.log("ThreeSceneAR source error!");
  }

  arActive(isActive) {
    // set lerping scale here?
    // TODO: we need a 'willHide' type event to shrink
    if (isActive) {
      this.scale.setValue(0);
      this.scale.setTarget(1);
    } else {
      this.scale.setTarget(0);
    }
    // console.log('ThreeSceneArDemo.arActive()', isActive);
  }

  // animation loop

  startAnimation() {
    this.animate();
    window.addEventListener("resize", () => this.resize());
  }

  animate() {
    this.updateObjects();
    this.threeScene.render();
    this.frameCount++;
    requestAnimationFrame(() => this.animate());

    if (this.queuedMesh) {
      this.arRoot.add(this.queuedMesh);
      this.queuedMesh = null;
    }
  }

  // model loading

  loadModel() {
    this.scale = new LinearFloat(0, 0.025);
    this.baseScale = 0.01;
    // Instantiate a GLTF loader
    var loader = new GLTFLoader();
    loader.load(
      // resource URL
      "../data/models/duck-v1/duck.gltf",
      // '../data/models/fox/Fox.gltf',
      // '../data/models/duck/Duck.gltf',
      // called when the resource is loaded
      (gltf) => {
        // add gltf model to scene - extract specific child of gltf scene to add to our ThreeScene
        this.model = gltf.scene.children[0].children[1];
        // debugger
        // this.model.castShadow = true;
        // this.model.receiveShadow = true;
        // this.model.material.wireframe = false;

        // calc scale
        var modelSize = this.model.geometry.boundingBox.min.sub(
          this.model.geometry.boundingBox.max
        );
        modelSize.set(
          Math.abs(modelSize.x),
          Math.abs(modelSize.y),
          Math.abs(modelSize.z)
        );
        this.modelH = 1;
        this.baseScale = (1 / modelSize.y) * this.modelH; // normalize to 1 and scale to size in AR world
        this.model.scale.set(this.baseScale, this.baseScale, this.baseScale);
        // console.log('modelSizeOrig', modelSize);
        // console.log('modelSizeScaled', this.modelH);

        // set position & rotation
        // this.model.rotation.x = -Math.PI/2;
        // this.model.position.set(0, this.modelH * 1.2, this.modelH/2);

        // add to three scene
        // this.arRoot.add(gltf.scene);

        let cubeMesh = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          new THREE.MeshNormalMaterial({
            transparent: false,
            side: THREE.DoubleSide,
          })
        );
        cubeMesh.position.y = 0.5;
        this.queuedMesh = cubeMesh;

        console.log(this.model);
      },
      // called while loading is progressing
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      // called when loading has errors
      (error) => {
        console.log("GLTF load error", error);
      }
    );
  }

  updateObjects() {
    // model
    this.scale.update();
    let easedScale = Penner.easeInOutQuad(this.scale.value(), 0, 1, 1);
    let curScale = easedScale * this.baseScale;
    if (this.model) {
      this.model.scale.set(curScale, curScale, curScale);
      this.model.rotation.y += 0.01;
    }
  }

  resize() {
    this.threeScene.resize();
  }
}

if (window.autoInitDemo) window.demo = new ThreeSceneArDemo(document.body);
