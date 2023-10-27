import * as THREE from '../vendor/three/three.module.js';

class ThreeSceneFBOPingPong {

  constructor(width, height, material, bgColor=0xff0000, isDataTexture=false) {
    this.width = width;
    this.height = height;
    this.bgColor = bgColor;
    this.isDataTexture = isDataTexture;
    this.devicePixelRatio = window.devicePixelRatio || 1;
    // if(this.isDataTexture) {
    //   this.buildSceneOrtho();
    //   this.buildDataRenderer();
    // } else {
      this.buildScene();
      this.buildRenderer();
    // }
  }

  buildScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.001, 1000);
    this.camera.position.z = (this.height / 2) / Math.tan(Math.PI / 8);

    var renderTargetParams = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.HalfFloatType
    };

    this.ping = new THREE.WebGLRenderTarget( this.width, this.height, renderTargetParams );
    this.pong = new THREE.WebGLRenderTarget( this.width, this.height, renderTargetParams );
    this.ping.texture.wrapS = THREE.ClampToEdgeWrapping;
    this.ping.texture.wrapT = THREE.ClampToEdgeWrapping;
    this.ping.texture.wrapS = THREE.ClampToEdgeWrapping;
    this.ping.texture.wrapT = THREE.ClampToEdgeWrapping;

    // this.material = new THREE.ShaderMaterial( {
    //     uniforms : uniforms2,
    //     vertexShader : document.getElementById( 'vertexShader' ).textContent,
    //     fragmentShader : document.getElementById( 'grayscott' ).textContent
    // } );

    var planeGeometry = new THREE.PlaneBufferGeometry(this.width, this.height, 1);
    this.plane = new THREE.Mesh( planeGeometry, this.material );
    this.scene.add( this.plane );
  }

  buildSceneOrtho() {
    // scene & camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 1);

    // camera-filling plane
    this.plane = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(1, 1),
      new THREE.MeshBasicMaterial({ color: 0x00ffff })
    );
    this.plane.position.set(0, 0, 0);
    this.scene.add(this.plane);
  }

  buildRenderer() {
    let options = {
      format: THREE.RGBAFormat,
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.RepeatWrapping,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
      preserveDrawingBuffer: true,
    };
    this.renderBuffer = new THREE.WebGLRenderTarget(this.width, this.height, options);
    this.renderBuffer.background = this.bgColor;
  }

  buildDataRenderer() {
    let options = {
      format: THREE.RGBAFormat,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      type: THREE.FloatType,
      stencilBuffer: false,
      preserveDrawingBuffer: true,
    }
    this.renderBuffer = new THREE.WebGLRenderTarget(this.width, this.height, options);
    this.renderBuffer.background = this.bgColor;
  }

  setMaterial(material) {
    this.plane.material = material;
    this.plane.material.needsUpdate = true;
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

  swapBuffers() {
    var a = this.pong;
    this.pong = this.ping;
    this.ping = a;
    this.plane.material.texture.value = this.pong.texture;
  }

  render(mainRenderer) {
    // uses main WebGLRenderer, passed in from the main app
    // it could also pass in a different scene & camera if we wanted to get fancy with the main scene/camera
    mainRenderer.setRenderTarget(this.renderBuffer);
    mainRenderer.render(this.scene, this.camera);
    mainRenderer.setRenderTarget(null);

    // render debug view if we have one
    if(this.debugRenderer) {
      this.debugRenderer.render( scene, camera );
    }
  }

}

// ThreeSceneFBO.defaultVertShader = `
//   precision highp float;
  
//   uniform mat4 modelMatrix;
//   uniform mat4 modelViewMatrix;
//   uniform mat3 normalMatrix;
//   uniform mat4 projectionMatrix;

//   attribute vec3 position;
//   attribute vec2 uv;

//   varying vec2 vUv;
//   varying vec3 vPos;
//   void main() {
//     vUv = uv;
//     vPos = position;
//     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
//   }
// `;

export default ThreeSceneFBOPingPong;
