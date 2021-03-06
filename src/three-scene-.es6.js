import * as THREE from '../vendor/three/three.module.js';

class ThreeScene {

  constructor(el=document.body, bgColor=0xffffff, transparent=false) {
    this.el = el;
    this.elSize = this.el.getBoundingClientRect();
    this.bgColor = bgColor;
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
    this.VIEW_ANGLE = 45;
    this.NEAR = 0.1;
    this.FAR = 20000;
    this.camera = new THREE.PerspectiveCamera(this.VIEW_ANGLE, this.ASPECT, this.NEAR, this.FAR);
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
