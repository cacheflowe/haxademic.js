import DemoBase from './demo--base.es6.js';
import * as THREE from '../vendor/three/three.module.js';
import PointerPos from '../src/pointer-pos.es6.js';
import MobileUtil from '../src/mobile-util.es6.js';
import ThreeSceneFBO from '../src/three-scene-fbo.es6.js';
import ThreeScene from '../src/three-scene-.es6.js';

class ThreeSceneFboBackgroundDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [], 'ThreeScene | FBO Background', 'three-scene-fbo-background', 'A THREE.js scene with a shader background', true);
  }

  // Info: 
  // - https://discourse.threejs.org/t/how-do-i-use-my-own-custom-shader-as-a-scene-background/13598/4
  // - https://stackoverflow.com/questions/19865537/three-js-set-background-image

  init() {
    // setup
    this.setupInput();
    this.setupScene();
    this.addLighting();
    this.buildCube();
    // this.buildBackground();
    this.buildBackgroundFbo();
    this.startAnimation();
  }

  setupInput() {
    this.pointerPos = new PointerPos();
    MobileUtil.lockTouchScreen(true);
    MobileUtil.disableTextSelect(document.body, true);
  }

  setupScene() {
    this.threeScene = new ThreeScene(this.el, 0xffffff);
    this.scene = this.threeScene.getScene();
    this.camera = this.threeScene.getCamera();

    // DO WE NEED THIS?
    // console.warn('Check background! autoClearColor???');
    // this.threeScene.getRenderer().autoClearColor = false;
  }

  addLighting() {
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);
    var pointLight = new THREE.PointLight(0x444444, 1, 0);
    pointLight.position.set(-100, 100, 50);
    this.scene.add(pointLight);
  }

  startAnimation() {
    this.frameCount = 0;
    this.animate();
    window.addEventListener('resize', () => this.resize());
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 400);
  }

  buildCube() {
    let cubeSize = 150;
    this.materialCube = new THREE.MeshPhongMaterial({
      color: 0x00ffbb, // 0x00ffbb
      emissive : 0x000000, // 0x000000
      specular : 0x666666,
      shininess : 10,
      flatShading : false
    });

    this.cubeMesh = new THREE.Mesh(new THREE.BoxBufferGeometry(cubeSize, cubeSize * 0.4, cubeSize * 0.4), this.materialCube);
    // this.cubeMesh.castShadow = true;
    // this.cubeMesh.position.set(0, 0, 0);
    this.scene.add(this.cubeMesh);
  }

  buildBackground() {
    this.bgTexture = new THREE.TextureLoader().load('../images/checkerboard-16-9.png');
    this.scene.background = this.bgTexture;
  }

  buildBackgroundFbo() {
    // build FBO and debug renderer
    this.threeFBO = new ThreeSceneFBO(512, 512, 0x00ffff);
    let debugFboCanvas = this.threeFBO.addDebugCanvas();

    // add debug renderer to DOM
    this.debugEl.appendChild(debugFboCanvas);
    debugFboCanvas.style.setProperty('width', '128px');
    debugFboCanvas.style.setProperty('height', '128px');
    debugFboCanvas.style.setProperty('border', '2px solid #000');
    debugFboCanvas.style.setProperty('box-sizing', 'border-box');

    // create shader material
    this.gradientMaterial = new THREE.RawShaderMaterial( {
      uniforms: {
        "time": { value: 0.0 },
      },
      vertexShader: ThreeSceneFBO.defaultRawVertShader,
      fragmentShader: `
        precision highp float;

        uniform float time;
        varying vec2 vUv;
        varying vec3 vPos;

        void main() {
          // radial gradient
          float gradientProgress = -time * 15. + length(vUv - 0.5) * 15.;
          gl_FragColor = vec4(
            0.45 + 0.25 * sin(gradientProgress * 5.),
            0.75 + 0.25 * sin(gradientProgress * 4.),
            0.65 + 0.35 * sin(gradientProgress * 3.),
            1.
          );
        }
      `,
    });
    this.threeFBO.setMaterial(this.gradientMaterial);

    // set texture on bg
    this.bgTexture = this.threeFBO.getTexture();
    this.scene.background = this.bgTexture;
    this.updateBgAspect();
  }

  updateBgAspect() {
    const imageAspect = this.bgTexture.image ? this.bgTexture.image.width / this.bgTexture.image.height : 1;
    const aspect = imageAspect / this.threeScene.getAspectRatio();

    this.bgTexture.offset.x = aspect > 1 ? (1 - 1 / aspect) / 2 : 0;
    this.bgTexture.repeat.x = aspect > 1 ? 1 / aspect : 1;

    this.bgTexture.offset.y = aspect > 1 ? 0 : (1 - aspect) / 2;
    this.bgTexture.repeat.y = aspect > 1 ? 1 : aspect;
  }

  updateShaderBg() {
    if(!this.threeFBO) return;

    // update & render shader 
    const time = performance.now() * 0.0001;
    this.gradientMaterial.uniforms[ "time" ].value = time;
    this.threeFBO.render(this.threeScene.getRenderer());
    this.updateBgAspect();
  }

  updateCube() {
    // cube
    this.cubeMesh.rotation.y = -1 + 2 * this.pointerPos.xNorm(this.el);
    this.cubeMesh.rotation.x = -1 + 2 * this.pointerPos.yNorm(this.el);
    if(this.materialCube.map) this.materialCube.map.needsUpdate = true;
  }

  animate() {
    this.updateCube();
    this.updateShaderBg()
    this.threeScene.render();
    this.frameCount++;
    requestAnimationFrame(() => this.animate());
  }
  
  resize() {
    this.threeScene.resize();
  }

}

if(window.autoInitDemo) window.demo = new ThreeSceneFboBackgroundDemo(document.body);
