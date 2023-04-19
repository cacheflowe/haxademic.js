import * as THREE from '../vendor/three/three.module.js';

class ThreeScene {

  constructor(el=document.body, bgColor=0xffffff, ortho=false, transparent=false) {
    this.el = el;
    this.elSize = this.el.getBoundingClientRect();
    this.bgColor = bgColor;
    this.ortho = ortho;
    this.transparent = transparent;
    this.devicePixelRatio = window.devicePixelRatio || 1;
    this.buildScene();
    this.buildRenderer();
    // this.buildLights();
    this.addToDOM();
  }

  buildScene() {
    this.scene = new THREE.Scene();
    this.getContainerSize();
    if (this.ortho == false) {
      this.VIEW_ANGLE = 45;
      this.NEAR = 0.1;
      this.FAR = 20000;
      this.camera = new THREE.PerspectiveCamera(this.VIEW_ANGLE, this.ASPECT, this.NEAR, this.FAR);
    } else {
      this.FRUSTUM = 400;
      this.camera = new THREE.OrthographicCamera(
        (this.FRUSTUM * this.ASPECT) / -2,
        (this.FRUSTUM * this.ASPECT) / 2,
        this.FRUSTUM / 2,
        this.FRUSTUM / -2,
        1,
        1000
      );
    }
    this.scene.add(this.camera);
    this.camera.position.set(0,0,400);
    this.camera.lookAt(this.scene.position);
  }

  buildRenderer() {
    let options = {
      antialias: true,
    };
    if(this.transparent) options.alpha = true;
    this.renderer = new THREE.WebGLRenderer(options);
    this.renderer.setClearColor(this.bgColor, (this.transparent) ? 0 : 1);
		this.renderer.setPixelRatio(this.devicePixelRatio);
    this.renderer.setSize(this.elSize.width, this.elSize.height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // console.log(this.renderer.capabilities);
  }

  buildLights() {
    var ambientLight = new THREE.AmbientLight(0x444444);
    this.scene.add(ambientLight);
  }

  // add pointer interactivity

  buildRaycaster(pointerPos, isMobile=false, callback=null) {
    this.pointerPos = pointerPos;
    this.raycaster = new THREE.Raycaster();
    this.mouseCoords = new THREE.Vector2();
    this.hoveredMesh = null;
    this.rayCastMeshChangedCallback = callback;
  }

  updateRaycasting() {
    let newX = this.pointerPos.xNorm(this.canvasEl()) * 2 - 1;
    let newY = this.pointerPos.yNorm(this.canvasEl()) * -2 + 1;
    // update expected mouse position for raycaster
    this.mouseCoords.x = newX;
    this.mouseCoords.y = newY;
    // raycast for mouseOver / mouseOut
    let prevMesh = this.hoveredMesh;
    this.raycaster.setFromCamera(this.mouseCoords, this.camera);
    let intersects = this.raycaster.intersectObjects(this.scene.children);
    if(intersects.length > 0) {
      intersects = intersects.sort((a, b) => { return a.distance - b.distance });
      this.hoveredMesh = intersects[0].object;
    } else {
      this.hoveredMesh = null;
    }
    if(prevMesh != this.hoveredMesh) {
      if(this.rayCastMeshChangedCallback) this.rayCastMeshChangedCallback(this.hoveredMesh);
    }
  }

  getHoveredMesh() {
    return this.hoveredMesh || null;
  }

  // ---

  addToDOM() {
    this.container = document.createElement('div');
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
    if(this.raycaster) this.updateRaycasting();
    this.checkRenderFrame();
  }

  checkRenderFrame() {
    if(!!this.saveFrameCallback) {
      this.saveFrameCallback();
      this.saveFrameCallback = null;
    }
  }

  saveJpg(callback, quality=1.0) {
    this.saveFrameCallback = () => {
      const imgBase64 = this.canvasEl().toDataURL('image/jpeg', quality);
      callback(imgBase64);
    };
  }

  savePng(callback) {
    this.saveFrameCallback = () => {
      const imgBase64 = this.canvasEl().toDataURL();
      callback(imgBase64);
    };
  }

  getContainerSize() {
    this.elSize = this.el.getBoundingClientRect();
    this.ASPECT = this.elSize.width / this.elSize.height;
  }

  resize() {
    this.fitToHtmlContainer();
    this.camera.aspect = this.ASPECT;
    this.camera.aspect = this.ASPECT
    if (this.ortho) {
      this.camera.left = (-this.FRUSTUM * this.ASPECT) / 2
      this.camera.right = (this.FRUSTUM * this.ASPECT) / 2
      this.camera.top = this.FRUSTUM / 2
      this.camera.bottom = -this.FRUSTUM / 2
    };
    this.camera.updateProjectionMatrix();
  }

  fitToHtmlContainer() {
    this.getContainerSize();
    this.container.style.width = this.elSize.width + 'px';
    this.container.style.height = this.elSize.height + 'px';
    this.renderer.setSize(this.elSize.width, this.elSize.height);
  }

}

export default ThreeScene;
