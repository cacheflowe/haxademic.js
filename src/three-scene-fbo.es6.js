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
    // console.log(this.renderBuffer);
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

  getRenderTarget() {
    return this.renderBuffer;
  }

  getTexture() {
    return this.renderBuffer.texture;
  }

  addDebugCanvas(el=document.body, transparent=false) {
    let options = {antialias: true};
    if(transparent) options.alpha = true;
    this.debugRenderer = new THREE.WebGLRenderer(options);
    this.debugRenderer.setClearColor(0xff000000, (transparent) ? 0 : 1);
		this.debugRenderer.setPixelRatio(window.devicePixelRatio || 1);
    this.debugRenderer.setSize(this.width, this.height);

    // add to DOM
    let newGLCanvas = this.debugRenderer.domElement;
    el.appendChild(newGLCanvas);

    return newGLCanvas; 
  }

  render(mainRenderer, scene=this.scene, camera=this.camera) {
    // uses main WebGLRenderer, passed in from the main app
    // it could also pass in a different scene & camera if we wanted to get fancy with the main scene/camera
    mainRenderer.setRenderTarget(this.renderBuffer);
    mainRenderer.render(scene, camera);
    mainRenderer.setRenderTarget(null);

    // render debug view if we have one
    if(this.debugRenderer) {
      this.debugRenderer.render( scene, camera );
    }
  }

}

ThreeSceneFBO.defaultVertShader = `
  precision highp float;
  
  uniform mat4 modelMatrix;
  uniform mat4 modelViewMatrix;
  uniform mat3 normalMatrix;
  uniform mat4 projectionMatrix;

  attribute vec3 position;
  attribute vec2 uv;

  varying vec2 vUv;
  varying vec3 vPos;
  void main() {
    vUv = uv;
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
  }
`;

ThreeSceneFBO.defaultVertShader = `
  precision highp float;
  
  varying vec2 vUv;
  varying vec3 vPos;
  
  void main() {
    vUv = uv;
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
  }
`;

export default ThreeSceneFBO;
