import DemoBase from "./demo--base.js";
import * as THREE from "../vendor/three/three.module.js";
import PointerPos from "../src/pointer-pos.js";
import MobileUtil from "../src/mobile-util.js";
import ThreeScene from "../src/three-scene-.js";

class ThreeSceneDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "ThreeScene",
      "three-scene",
      "A basic THREE.js scene wrapper with a resize listener. Press J to export a jpeg, and P to export a png.",
      true
    );
  }

  init() {
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
    this.threeScene = new ThreeScene(this.el, 0xeeeeee);
    this.scene = this.threeScene.getScene();
    this.camera = this.threeScene.getCamera();
    // this.threeScene.buildLights();
    this.threeScene.buildRaycaster(this.pointerPos, (mesh) =>
      this.raycastHoverChanged(mesh)
    );
    document.addEventListener(
      MobileUtil.isMobileBrowser() ? "touchend" : "click",
      (e) => this.onDocumentMouseClick(e)
    );
  }

  startAnimation() {
    this.frameCount = 0;
    this.animate();
    window.addEventListener("resize", () => this.resize());
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 400);
  }

  buildCube() {
    let cubeSize = 150;
    this.materialCube = new THREE.MeshPhongMaterial({
      color: 0x00ffbb, // 0x00ffbb
      emissive: 0x444444, // 0x000000
      specular: 0x666666,
      shininess: 25,
      flatShading: false,
      // color: 0x9c6e49,
      // specular: 0x666666,
      // shininess: 25,
      // bumpMap: mapHeight,
      // bumpScale: 10,
    });

    this.cubeMesh = new THREE.Mesh(
      new THREE.BoxGeometry(cubeSize, cubeSize * 0.4, cubeSize * 0.4),
      this.materialCube
    );
    this.cubeMesh.castShadow = true;
    this.cubeMesh.receiveShadow = true;
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
      new THREE.PlaneGeometry(planeSize, planeSize),
      new THREE.ShadowMaterial({ opacity: 0.5 })
    );
    plane.rotation.x = -Math.PI / 2;
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
    this.spotlight.decay = 0;
    this.spotlight.angle = 1;
    this.spotlight.distance = 1000;
    this.scene.add(this.spotlight);

    // add light helper
    var spotlightDebug = true;
    if (spotlightDebug == true) {
      this.lightHelper = new THREE.SpotLightHelper(this.spotlight);
      this.scene.add(this.lightHelper);
    }
  }

  updateObjects() {
    // cube
    this.cubeMesh.rotation.y = -1 + 2 * this.pointerPos.xNorm(this.el);
    this.cubeMesh.rotation.x = -1 + 2 * this.pointerPos.yNorm(this.el);
    // if (this.materialCube.map) this.materialCube.map.needsUpdate = true;
    // this.materialCube.needsUpdate = true;
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
    if (window.pixiStage && this.textureMapInited != true) {
      this.textureMapInited = true;
      // set static size of PIXI stage to avoid THREE continuoulsy converting it to power-of-two size
      pixiStage.el.style.width = "512px";
      pixiStage.el.style.height = "256px";
      window.dispatchEvent(new Event("resize")); // force PIXI to pick up stage size change
      // add map to material
      this.materialCube.map = new THREE.CanvasTexture(pixiStage.canvas());
    }
  }

  resize() {
    this.threeScene.resize();
  }

  raycastHoverChanged(mesh) {
    console.log(mesh);
    this.materialCube.color.set(mesh == this.cubeMesh ? 0xffffbb : 0x00ffbb);
  }

  onDocumentMouseClick(e) {
    if (this.threeScene.getHoveredMesh() == this.cubeMesh) {
      console.log("clicked box!");
    }
  }

  keyDown(key) {
    // asynchronous save post-render(). callback brings the encoded image back from the render loop
    if (key == "j") {
      this.threeScene.saveJpg((imageBase64) => {
        this.debugEl.innerHTML += `<img src="${imageBase64}" style="width: 250px; box-shadow: 0 0 5px #000000;">`;
      }, 0.5);
    }
    if (key == "p") {
      this.threeScene.savePng((imageBase64) => {
        this.debugEl.innerHTML += `<img src="${imageBase64}" style="width: 250px; box-shadow: 0 0 5px #000000;">`;
      });
    }
  }
}

if (window.autoInitDemo) window.demo = new ThreeSceneDemo(document.body);
