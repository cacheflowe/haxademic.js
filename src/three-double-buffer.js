import * as THREE from "../vendor/three/three.module.js";

class ThreeDoubleBuffer {
  constructor(
    width,
    height,
    bufferMaterial,
    isData = false,
    bgColor = 0xff0000,
    transparent = false
  ) {
    this.width = width;
    this.height = height;
    this.bufferMaterial = bufferMaterial;
    this.bgColor = bgColor;
    this.transparent = transparent;
    this.devicePixelRatio = window.devicePixelRatio || 1;
    this.buildBuffers(isData);
  }

  getOptions() {
    return {
      format: THREE.RGBAFormat,
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.RepeatWrapping,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      // type: THREE.UnsignedByteType,
      type: THREE.HalfFloatType,
      depthBuffer: false,
      stencilBuffer: false,
    };
  }

  getOptionsDataTexture() {
    return {
      format: THREE.RGBAFormat,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      type: THREE.HalfFloatType,
      depthBuffer: false,
      stencilBuffer: false,
    };
  }

  buildBuffers(isData) {
    // FBO scene & camera
    this.bufferScene = new THREE.Scene();
    this.bufferCamera = new THREE.OrthographicCamera(
      -0.5,
      0.5,
      0.5,
      -0.5,
      0,
      1
    );

    // build render targets
    let options = isData ? this.getOptionsDataTexture() : this.getOptions();
    this.textureOld = new THREE.WebGLRenderTarget(
      this.width,
      this.height,
      options
    );
    this.textureCur = new THREE.WebGLRenderTarget(
      this.width,
      this.height,
      options
    );

    // camera-filling plane
    this.planeGeom = new THREE.PlaneGeometry(this.width, this.height, 1);
    this.plane = new THREE.Mesh(this.planeGeom, this.bufferMaterial);
    this.plane.position.set(0, 0, 0);
    this.bufferScene.add(this.plane);

    // add mesh to show on screen if we'd like.
    // this would get attached outside of this object
    let finalMaterial = new THREE.MeshBasicMaterial({ map: this.textureCur });
    this.displayMesh = new THREE.Mesh(this.planeGeom, finalMaterial);
  }

  setUniform(key, val) {
    this.bufferMaterial.uniforms[key].value = val;
  }

  getUniform(key) {
    return this.bufferMaterial.uniforms[key].value;
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
    return this.bufferScene;
  }

  getCamera() {
    return this.bufferCamera;
  }

  getTexture() {
    return this.textureCur.texture;
  }

  getTextureOld() {
    return this.textureOld.texture;
  }

  render(renderer, debugRenderer = null) {
    // render!
    renderer.setRenderTarget(this.textureCur);
    renderer.render(this.bufferScene, this.bufferCamera);
    renderer.setRenderTarget(null);

    // render in time if we pass one in
    // this isn't working...
    if (debugRenderer) {
      debugRenderer.render(this.bufferScene, this.bufferCamera);
    }

    // ping pong buffers
    var temp = this.textureOld;
    this.textureOld = this.textureCur;
    this.textureCur = temp;

    // swap materials in simulation scene and in display mesh
    this.bufferMaterial.uniforms.lastFrame.value = this.textureOld.texture;
    this.displayMesh.material.map = this.textureCur.texture;
  }
}

export default ThreeDoubleBuffer;
