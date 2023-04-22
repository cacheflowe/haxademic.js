import DemoBase from "./demo--base.es6.js";
import * as THREE from "../vendor/three/three.module.js";
import EasingFloat from "../src/easing-float.es6.js";
import PointerPos from "../src/pointer-pos.es6.js";
import MobileUtil from "../src/mobile-util.es6.js";
import ThreeScene from "../src/three-scene-.es6.js";

class ThreeSceneDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "ThreeScene | Billboard Particles",
      "three-scene-billboard-particles",
      "Mandala particles from that one project",
      true
    );
  }

  init() {
    // setup
    this.setupInput();
    this.setupScene();
    this.buildParticles();
    this.startAnimation();
  }

  setupInput() {
    this.pointerPos = new PointerPos();
    MobileUtil.lockTouchScreen(true);
    MobileUtil.disableTextSelect(document.body, true);
  }

  setupScene() {
    this.threeScene = new ThreeScene(this.el, 0x1e1e3a);
    this.scene = this.threeScene.getScene();
    this.camera = this.threeScene.getCamera();
  }

  startAnimation() {
    this.frameCount = 0;
    this.animate();
    window.addEventListener("resize", () => this.resize());
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 400);
  }

  // TODO:
  // - Original code: https://threejs.org/examples/webgl_buffergeometry_instancing_billboards.html
  // - Additional attributes: https://stackoverflow.com/questions/35328937/how-to-tween-10-000-particles-in-three-js/35373349#35373349
  // - Alpha fixes? : https://discourse.threejs.org/t/threejs-and-the-transparent-problem/11553
  // - Why did the particles slow down? Particle size should stay below 4

  buildParticles() {
    this.vshader = `
      precision highp float;
      uniform mat4 modelMatrix;
      uniform mat4 modelViewMatrix;
      // uniform mat4 modelViewMatrixInverse;
      uniform mat3 normalMatrix;
      uniform mat4 projectionMatrix;
      uniform float time;

      attribute vec3 position;
      attribute vec2 uv;
      attribute vec3 translate;

      varying vec2 vUv;
      varying float vScale;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4( translate, 1.0 );
        vec3 trTime = vec3(translate.x + time, translate.y + time, translate.z + time);
        float scale = 4.0 + 1. * sin( trTime.x * 15. ) + sin( trTime.y * 13.2 ) + sin( trTime.z * 14.3 );
        vScale = scale;
        vec3 posOffset = vec3(
          0, 
          0,
          10. * sin(trTime.y * 10.) + 10. * sin(time/5.)
        );
        // posOffset.z = 0.;
        mvPosition.xyz += (position + posOffset) * scale;
        vUv = uv;
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
    this.fshader = `
      precision highp float;

      uniform sampler2D map;

      varying vec2 vUv;
      varying float vScale;

      // HSL to RGB Convertion helpers
      vec3 HUEtoRGB(float H){
        H = mod(H,1.0);
        float R = abs(H * 6.0 - 3.0) - 1.0;
        float G = 2.0 - abs(H * 6.0 - 2.0);
        float B = 2.0 - abs(H * 6.0 - 4.0);
        return clamp(vec3(R,G,B),0.0,1.0);
      }

      vec3 HSLtoRGB(vec3 HSL){
        vec3 RGB = HUEtoRGB(HSL.x);
        float C = (1.0 - abs(2.0 * HSL.z - 1.0)) * HSL.y;
        return (RGB - 0.5) * C + HSL.z;
      }

      void main() {
        vec4 diffuseColor = texture2D( map, vUv );
        gl_FragColor = vec4( diffuseColor.a * HSLtoRGB(vec3(vScale/7.0, 1.0, 0.85)), diffuseColor.w );
        // gl_FragColor = vec4( diffuseColor.xyz, 1.0 );
        // gl_FragColor = vec4(diffuseColor.a);
        // gl_FragColor = vec4( 0.5, 0.5, 0.9, 1.0 );

        if ( diffuseColor.a < 0.1 ) discard;
      }
    `;

    let stats;

    // build geometry for particles
    // const buffGeom = new THREE.CircleBufferGeometry( 1, 8 );
    const buffGeom = new THREE.PlaneBufferGeometry(1, 1, 1);
    let geometry = new THREE.InstancedBufferGeometry();
    geometry.index = buffGeom.index;
    geometry.attributes = buffGeom.attributes;

    const particleCount = 75000;

    // create positions
    const translateArray = new Float32Array(particleCount * 3);
    var radius = 0.35;
    var radiusOscRads = 0;
    var radiusOscFreq = 0.1;
    var rads = 0;
    var radInc = Math.PI / 180;
    this.meshRadius = 200;
    this.meshDepth = 800;
    var cupDepth = particleCount / 3;
    var backSideCup = true;
    var curZ = -1;
    var zInc = (1 / particleCount) * 1.85; // * 2 if we want it to have even depth behind the camera
    for (let i = 0, i3 = 0, l = particleCount; i < l; i++, i3 += 3) {
      // random positions
      /*
      translateArray[ i3 + 0 ] = Math.random() * 2 - 1;
      translateArray[ i3 + 1 ] = Math.random() * 2 - 1;
      translateArray[ i3 + 2 ] = Math.random() * 2 - 1;
      */
      // spiral
      var curRadius = radius * (1 + 0.25 * Math.sin(radiusOscRads));
      // var curRadius = radius + (radius * (0.5 * Math.sin(radiusOscRads)));
      radiusOscRads += radiusOscFreq;

      // cup on the backside
      if (backSideCup) {
        let growProgress = i / cupDepth;
        let radiusGrow = 0.05 + 0.85 * Math.sin((growProgress * Math.PI) / 2);
        // let radiusGrow = Math.sin(growProgress * Math.PI/2);
        if (growProgress > 1) radiusGrow = 1;
        curRadius *= radiusGrow;
      }
      // curRadius = radius;
      var x = Math.cos(rads) * curRadius;
      var y = Math.sin(rads) * curRadius;
      // var z = curZ;
      var z = curZ + 0.01 * Math.sin(i / 10);
      translateArray[i3 + 0] = x;
      translateArray[i3 + 1] = y;
      translateArray[i3 + 2] = z;

      // step
      rads += radInc;
      curZ += zInc;
    }

    geometry.setAttribute(
      "translate",
      new THREE.InstancedBufferAttribute(translateArray, 3)
    );
    this.mat4 = new THREE.Matrix4();

    this.material = new THREE.RawShaderMaterial({
      uniforms: {
        map: { value: new THREE.TextureLoader().load("../data/particle.png") },
        // "map": { value: new THREE.TextureLoader().load('../data/particle-circle-no-alpha.png')},
        time: { value: 0.0 },
        // "modelViewMatrixInverse": { value: this.mat4 }   // https://gist.github.com/spite/9110247
      },
      vertexShader: this.vshader,
      fragmentShader: this.fshader,
      depthTest: true,
      depthWrite: false,
      // blending: THREE.SubtractiveBlending,
      blending: THREE.AdditiveBlending,

      // trying - https://discourse.threejs.org/t/threejs-and-the-transparent-problem/11553/7
      depthWrite: false,
      depthTest: true,
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.scale.set(this.meshRadius, this.meshRadius, this.meshDepth);
    this.scene.add(this.mesh);

    // stats = new Stats();
    // this.el.appendChild( stats.dom );

    this.cameraXEase = new EasingFloat(0, 0.08, 0.00001);
    this.cameraYEase = new EasingFloat(0, 0.08, 0.00001);
  }

  updateObjects() {
    /*
    // update inverse matrix
    var m = new THREE.Matrix4();
    m.copy( this.mesh.matrixWorld );
    m.multiply( this.threeScene.getCamera().matrixWorldInverse );
    // var mInv = new THREE.Matrix4().getInverse( m );
    var mInv = m.invert();
    // matrixInv.copy( matrix ).invert()
    // this.material.uniforms['modelViewMatrixInverse'] = mInv;
    // console.log(mInv);
    // this.material.uniforms['modelViewMatrixInverse'] = mInv;
    this.mat4.copy(mInv);
    */

    // update shader
    const time = performance.now() * 0.0001;
    this.material.uniforms["time"].value = time;

    // rotate shape
    const cameraAmp = 0.08;
    this.cameraYEase
      .setTarget(-cameraAmp + cameraAmp * 2 * this.pointerPos.xNorm(this.el))
      .update();
    this.cameraXEase
      .setTarget(-cameraAmp + cameraAmp * 2 * this.pointerPos.yNorm(this.el))
      .update();
    this.mesh.rotation.x = this.cameraXEase.value();
    this.mesh.rotation.y = this.cameraYEase.value();
    this.mesh.position.set(0, 0, 0 + 600 * Math.sin(time * 2));
  }

  animate() {
    this.updateObjects();
    this.threeScene.render();
    // stats.update();
    this.frameCount++;
    requestAnimationFrame(() => this.animate());
  }

  resize() {
    this.threeScene.resize();
  }
}

if (window.autoInitDemo) window.demo = new ThreeSceneDemo(document.body);
