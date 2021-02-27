import * as THREE from '../vendor/three/three.module.js';

class ThreeScenePlane {

  constructor(width, height, bgColor=0xff0000, transparent=false) {
    this.width = width;
    this.height = height;
    this.bgColor = bgColor;
    this.transparent = transparent;
    this.devicePixelRatio = window.devicePixelRatio || 1;
    this.buildScene();
    this.buildRenderer();
  }

  buildScene() {
    // scene & camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.001, 1000);
    this.camera.position.z = (this.height / 2) / Math.tan(Math.PI / 8);

    // camera-filling plane
    this.plane = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(this.width, this.height, 1),
      new THREE.MeshBasicMaterial({ color: 0x00ffff })
    );
    this.scene.add(this.plane);
  }

  buildRenderer() {
    // See: view-source:https://threejs.org/examples/webgl_rtt.html
    let options = {
      antialias: true,
      depthBuffer: false,
      stencilBuffer: false
    };
    if(this.transparent) options.alpha = true;
    this.renderer = new THREE.WebGLRenderer(options);
    this.renderer.setClearColor(this.bgColor, (this.transparent) ? 0 : 1);
		this.renderer.setPixelRatio(this.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.render();
  }

  setMaterial(material) {
    return this.plane.material = material;
  }

  getWidth() {
    return this.width;
  }

  getHeight() {
    return this.height;
  }

  getPlane() {
    return this.plane;
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

  render() {
    this.renderer.render(this.scene, this.camera);
  }

}

export default ThreeScenePlane;
