import * as THREE from "../vendor/three/three.module.js";

class ThreeScene {
  constructor(options = {}) {
    // set default options
    this.options = {
      el: document.body,
      bgColor: 0xffffff,
      ortho: false,
      transparent: false,
      addLights: true,
      shadows: true,
    };
    // allow basic use - element and bg color
    if (options instanceof HTMLElement) {
      this.options.el = options;
      if (arguments.length > 1 && typeof arguments[1] == "number")
        this.options.bgColor = arguments[1];
    }
    // override default options
    for (let key in options) {
      this.options[key] = options[key];
    }

    // store el/renderer
    this.el = this.options.el;
    this.elSize = this.el.getBoundingClientRect();
    this.bgColor = this.options.bgColor;
    this.ortho = this.options.ortho;
    this.transparent = this.options.transparent;
    this.devicePixelRatio = window.devicePixelRatio || 1;

    // build THREE objects
    this.buildScene();
    this.buildRenderer();
    this.addToDOM();
    if (this.options.addLights) this.buildLights();
  }

  buildScene() {
    this.scene = new THREE.Scene();
    this.updateContainerSize();
    if (this.ortho == false) {
      this.buildPerspectiveCamera();
    } else {
      this.buildOrthoCamera();
    }
    this.scene.add(this.camera);
    this.camera.position.set(0, 0, 400);
    this.camera.lookAt(this.scene.position);
  }

  buildPerspectiveCamera() {
    this.VIEW_ANGLE = 45;
    this.NEAR = 0.1;
    this.FAR = 20000;
    this.camera = new THREE.PerspectiveCamera(
      this.VIEW_ANGLE,
      this.ASPECT,
      this.NEAR,
      this.FAR
    );
  }

  buildOrthoCamera() {
    this.FRUSTUM = this.sceneHeight();
    this.camera = new THREE.OrthographicCamera(
      (this.FRUSTUM * this.ASPECT) / -2,
      (this.FRUSTUM * this.ASPECT) / 2,
      this.FRUSTUM / 2,
      this.FRUSTUM / -2,
      1,
      1000
    );
  }

  buildRenderer() {
    let rendererOptions = {
      antialias: true,
    };
    if (this.transparent) rendererOptions.alpha = true;
    this.renderer = new THREE.WebGLRenderer(rendererOptions);
    this.renderer.setClearColor(this.bgColor, this.transparent ? 0 : 1);
    this.renderer.setPixelRatio(this.devicePixelRatio);
    this.renderer.setSize(this.sceneWidth(), this.sceneHeight());
    if (this.options.shadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    // console.log(this.renderer.capabilities)
  }

  buildLights() {
    const ambientLight = new THREE.AmbientLight(0x999999, Math.PI);
    this.scene.add(ambientLight);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 0, 1); //default; light shining from top
    light.castShadow = true; // default false
    this.scene.add(light);
  }

  // add pointer interactivity

  buildRaycaster(pointerPos, callback = null) {
    this.pointerPos = pointerPos;
    this.raycaster = new THREE.Raycaster();
    this.mouseCoords = new THREE.Vector2();
    this.hoveredMesh = null;
    this.rayCastMeshChangedCallback = callback;
  }

  updateRaycasting(meshes = this.scene.children) {
    let newX = this.pointerPos.xNorm(this.canvasEl()) * 2 - 1;
    let newY = this.pointerPos.yNorm(this.canvasEl()) * -2 + 1;
    // update expected mouse position for raycaster
    this.mouseCoords.x = newX;
    this.mouseCoords.y = newY;
    // raycast for mouseOver / mouseOut
    let prevMesh = this.hoveredMesh;
    this.raycaster.setFromCamera(this.mouseCoords, this.camera);
    let intersects = this.raycaster.intersectObjects(meshes, true); // true intersects all children
    if (intersects.length > 0) {
      intersects = intersects.sort((a, b) => {
        return a.distance - b.distance;
      });
      this.hoveredMesh = intersects[0].object;
    } else {
      this.hoveredMesh = null;
    }
    if (prevMesh != this.hoveredMesh) {
      console.log(this.hoveredMesh);
      if (this.rayCastMeshChangedCallback) {
        console.log(this.hoveredMesh);
        this.rayCastMeshChangedCallback(this.hoveredMesh);
      }
    }
  }

  getHoveredMesh() {
    return this.hoveredMesh || null;
  }

  // ---

  addToDOM() {
    this.container = document.createElement("div");
    this.el.appendChild(this.container);
    this.container.appendChild(this.renderer.domElement);
  }

  getScene() {
    return this.scene;
  }

  getCamera() {
    return this.camera;
  }

  canvasEl() {
    return this.renderer.domElement;
  }

  getRenderer() {
    return this.renderer;
  }

  getAspectRatio() {
    return this.ASPECT;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
    if (this.raycaster) this.updateRaycasting();
    this.checkRenderFrame();
  }

  checkRenderFrame() {
    if (this.saveFrameCallback) {
      this.saveFrameCallback();
      this.saveFrameCallback = null;
    }
  }

  saveJpg(callback, quality = 1.0) {
    this.saveFrameCallback = () => {
      const imgBase64 = this.canvasEl().toDataURL("image/jpeg", quality);
      callback(imgBase64);
    };
  }

  savePng(callback) {
    this.saveFrameCallback = () => {
      const imgBase64 = this.canvasEl().toDataURL();
      callback(imgBase64);
    };
  }

  updateContainerSize() {
    this.elSize = this.el.getBoundingClientRect();
    this.ASPECT = this.sceneWidth() / this.sceneHeight();
  }

  sceneWidth() {
    return this.elSize.width;
  }

  sceneHeight() {
    return this.elSize.height;
  }

  resize() {
    this.fitToHtmlContainer();
    this.camera.aspect = this.ASPECT;
    if (this.ortho) this.resizeOrtho();
    this.camera.updateProjectionMatrix();
  }

  resizeOrtho() {
    this.FRUSTUM = this.sceneHeight();
    this.camera.left = (-this.FRUSTUM * this.ASPECT) / 2;
    this.camera.right = (this.FRUSTUM * this.ASPECT) / 2;
    this.camera.top = this.FRUSTUM / 2;
    this.camera.bottom = -this.FRUSTUM / 2;
  }

  fitToHtmlContainer() {
    this.updateContainerSize();
    this.container.style.width = this.sceneWidth() + "px";
    this.container.style.height = this.sceneHeight() + "px";
    this.renderer.setSize(this.sceneWidth(), this.sceneHeight());
  }
}

export default ThreeScene;
