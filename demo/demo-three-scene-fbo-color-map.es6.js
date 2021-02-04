import DemoBase from './demo--base.es6.js';
import * as THREE from '../vendor/three/three.module.js';
import Stats from '../vendor/stats.module.js';
import EasingFloat from '../src/easing-float.es6.js';
import PointerPos from '../src/pointer-pos.es6.js';
import MobileUtil from '../src/mobile-util.es6.js';
import ThreeScene from '../src/three-scene-.es6.js';
import ThreeSceneFBO from '../src/three-scene-fbo.es6.js';

class ThreeSceneDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [], 'ThreeSceneFbo | Shader Color Map', 'three-scene-fbo-color-map', "Use a 2d shader render target as the color map uniform for a particle system.", true);
  }

  init() {
    // setup
    this.setupInput();
    this.setupScene();
    this.buildStats();
    this.buildFbo();
    this.buildParticles();
    this.startAnimation();
  }

  setupInput() {
    this.pointerPos = new PointerPos();
    MobileUtil.lockTouchScreen(true);
    MobileUtil.disableTextSelect(document.body, true);
  }

  setupScene() {
    this.threeScene = new ThreeScene(this.el, 0x1E1E3A);
    this.scene = this.threeScene.getScene();
    this.camera = this.threeScene.getCamera();
  }

  buildStats() {
    this.stats = new Stats();
    this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild( this.stats.dom );
  }

  startAnimation() {
    this.animate();
    window.addEventListener('resize', () => this.resize());
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 400);
  }

  buildFbo() {
    this.threeFBO = new ThreeSceneFBO(512, 512, 0x00ffff);

    // shaders
    const vShader = `
      precision highp float;
      uniform mat4 modelMatrix;
      uniform mat4 modelViewMatrix;
      uniform mat3 normalMatrix;
      uniform mat4 projectionMatrix;
      uniform float time;
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

    const fShader = `
      precision highp float;

      uniform float time;
      varying vec2 vUv;
      varying vec3 vPos;

      void main() {
        // x-axis gradient
        gl_FragColor = vec4(
          0.5 + 0.5 * sin(time*20. + vUv.x * 5.),
          0.5 + 0.5 * sin(time*30. + vUv.x * 4.),
          0.5 + 0.5 * sin(time*10. + vUv.x * 3.),
          1.);
      }
    `;

    // create shader material
    this.gradientMaterial = new THREE.RawShaderMaterial( {
      uniforms: {
        "time": { value: 0.0 },
      },
      vertexShader: vShader,
      fragmentShader: fShader,
    });
    this.threeFBO.setMaterial(this.gradientMaterial);

    // add debug plane
    // build shape
    let planeResolution = 1;
    this.planeGeometry = new THREE.PlaneGeometry(80, 80, planeResolution, planeResolution);
    this.planeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      wireframe: false,
      map: this.threeFBO.getRenderTargetTexture(),
      transparent: true,
    });
    this.plane = new THREE.Mesh( this.planeGeometry, this.planeMaterial );
    this.plane.position.set(0, 0, 0);
    this.scene.add( this.plane );

  }

  buildParticles() {
    this.vshader = `
      precision highp float;
      uniform mat4 modelMatrix;
      uniform mat4 modelViewMatrix;
      uniform mat3 normalMatrix;
      uniform mat4 projectionMatrix;
      uniform float time;

      attribute vec3 position;
      attribute vec2 uv;
      attribute vec3 translate;
      attribute float colorU;

      varying vec2 vUv;
      varying float vScale;
      varying float vColorU;

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
        posOffset.z = 0.;
        mvPosition.xyz += (position + posOffset) * scale;
        vUv = uv;
        vColorU = colorU;
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
    this.fshader = `
      precision highp float;

      uniform sampler2D map;
      uniform sampler2D colorMap;

      varying vec2 vUv;
      varying float vScale;
      varying float vColorU;
      

      void main() {
        vec4 diffuseColor = texture2D( map, vUv );
        // vec4 diffuseColor2 = texture2D( colorMap, vUv );
        vec4 diffuseColor2 = texture2D( colorMap, vec2(vColorU, 0.5) );
        gl_FragColor = vec4(diffuseColor2.rgb, diffuseColor.a);
      }
    `;

    // build geometry for particles 
    // const buffGeom = new THREE.CircleBufferGeometry( 1, 8 );
    const buffGeom = new THREE.PlaneBufferGeometry( 1, 1, 1 );
    let geometry = new THREE.InstancedBufferGeometry();
    geometry.index = buffGeom.index;
    geometry.attributes = buffGeom.attributes;

    const particleCount = 75000;

    // create positions
    const translateArray = new Float32Array( particleCount * 3 );
    const colorUArray = new Float32Array( particleCount );
    this.meshRadius = 200;
    this.meshDepth = 800;
    for ( let i = 0, i3 = 0, l = particleCount; i < l; i ++, i3 += 3 ) {
      // random positions
      translateArray[ i3 + 0 ] = Math.random() * 2 - 1;
      translateArray[ i3 + 1 ] = Math.random() * 2 - 1;
      translateArray[ i3 + 2 ] = Math.random() * 2 - 1;
      colorUArray[i] = i/particleCount;
    }

    geometry.setAttribute( 'translate', new THREE.InstancedBufferAttribute( translateArray, 3 ) );
    geometry.setAttribute( 'colorU', new THREE.InstancedBufferAttribute( colorUArray, 1 ) );
    this.mat4 = new THREE.Matrix4();

    this.material = new THREE.RawShaderMaterial( {
      uniforms: {
        "map": { value: new THREE.TextureLoader().load('../data/particle.png')},
        "colorMap": { value: this.threeFBO.getRenderTargetTexture()},
        "time": { value: 0.0 },
      },
      vertexShader: this.vshader,
      fragmentShader: this.fshader,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending, // handle z-stacking, instead of more difficult measures: https://discourse.threejs.org/t/threejs-and-the-transparent-problem/11553/7
    });

    this.mesh = new THREE.Mesh( geometry, this.material );
    this.mesh.scale.set(this.meshRadius, this.meshRadius, this.meshDepth);
    this.scene.add( this.mesh );

    this.cameraXEase = new EasingFloat(0, 0.08, 0.00001);
    this.cameraYEase = new EasingFloat(0, 0.08, 0.00001);
  }

  updateObjects() {
    // update shader
    const time = performance.now() * 0.0001;
    this.material.uniforms[ "time" ].value = time;
    this.gradientMaterial.uniforms[ "time" ].value = time;

    // rotate shape
    const cameraAmp = 0.08;
    this.cameraYEase.setTarget(-cameraAmp + cameraAmp*2 * this.pointerPos.xNorm(this.el)).update();
    this.cameraXEase.setTarget(-cameraAmp + cameraAmp*2 * this.pointerPos.yNorm(this.el)).update();
    this.mesh.rotation.x = this.cameraXEase.value();
    this.mesh.rotation.y = this.cameraYEase.value();
    // this.mesh.position.set(0, 0, 0 + 600 * Math.sin(time*2));
  }

  animate() {
    if(this.stats) this.stats.begin();
    this.updateObjects();
    // this.threeFBO.setDebugCtx(this.ctx);
    this.threeFBO.render(this.threeScene.getRenderer());
    this.threeScene.render();
    requestAnimationFrame(() => this.animate());
    if(this.stats) this.stats.end();
  }
  
  resize() {
    this.threeScene.resize();
  }

}

if(window.autoInitDemo) window.demo = new ThreeSceneDemo(document.body);
