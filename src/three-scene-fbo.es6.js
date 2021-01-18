import * as THREE from '../vendor/three/three.module.js';

class ThreeSceneFBO {

  constructor(width, height, bgColor=0xff0000) {
    this.width = width;
    this.height = height;
    this.bgColor = bgColor;
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
      new THREE.PlaneBufferGeometry(this.width, this.height),
      new THREE.MeshBasicMaterial({ color: 0x00ffff })
    );
    this.plane.position.set(0, 0, 0);
    this.scene.add(this.plane);
  }

  buildRenderer() {
    let options = {
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
    };
    this.renderBuffer = new THREE.WebGLRenderTarget(this.width, this.height, options);
    this.renderBuffer.background = this.bgColor;
    console.log(this.renderBuffer);
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
    return this.renderBuffer.domElement;
  }

  getRenderTarget() {
    return this.renderBuffer;
  }

  getRenderTargetTexture() {
    return this.renderBuffer.texture;
  }

  render(mainRenderer, scene=this.scene, camera=this.camera) {
    // uses main WebGLRenderer, passed in from the main app
    // it could also pass in a different scene & camera if we wanted to get fancy with the main scene/camera
    mainRenderer.setRenderTarget(this.renderBuffer);
    mainRenderer.render(scene, camera);
    mainRenderer.setRenderTarget(null);
  }

}

export default ThreeSceneFBO;
