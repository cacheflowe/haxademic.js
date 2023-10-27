import DemoBase from "./demo--base.es6.js";
import * as THREE from "../vendor/three/three.module.js";
import Stats from "../vendor/stats.module.js";
import EasingFloat from "../src/easing-float.es6.js";
import PointerPos from "../src/pointer-pos.es6.js";
import MobileUtil from "../src/mobile-util.es6.js";
import ThreeScene from "../src/three-scene-.es6.js";
import ThreeSceneFBO from "../src/three-scene-fbo.es6.js";

class ThreeSceneDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "ThreeSceneFbo | Shader Color Map",
      "three-scene-fbo-color-map",
      "Use a 2d shader render target as the color map uniform for a particle system.",
      true
    );
  }

  init() {
    this.setupInput();
    this.setupScene();
    this.buildStats();
    this.buildColorMapFbo();
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

  buildStats() {
    this.stats = new Stats();
    this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(this.stats.dom);
  }

  startAnimation() {
    this.animate();
    window.addEventListener("resize", () => this.resize());
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 400);
  }

  buildColorMapFbo() {
    // build FBO and debug renderer
    this.threeFBO = new ThreeSceneFBO(512, 8, 0x00ffff);
    let debugFboCanvas = this.threeFBO.addDebugCanvas();

    // add debug renderer to DOM
    this.debugEl.appendChild(debugFboCanvas);
    debugFboCanvas.style.setProperty("width", "100%");
    debugFboCanvas.style.setProperty("height", "32px");
    debugFboCanvas.style.setProperty("border", "2px solid #000");
    debugFboCanvas.style.setProperty("box-sizing", "border-box");

    // create shader material
    this.gradientMaterial = new THREE.RawShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
      },
      vertexShader: ThreeSceneFBO.defaultRawVertShader,
      fragmentShader: `
        precision highp float;

        uniform float time;
        varying vec2 vUv;
        varying vec3 vPos;

        void main() {
          // x-axis gradient
          gl_FragColor = vec4(
            0.45 + 0.25 * sin(time*10. + vUv.x * 5.),
            0.75 + 0.25 * sin(time*7. + vUv.x * 4.),
            0.65 + 0.35 * sin(time*5. + vUv.x * 3.),
            1.);
        }
      `,
    });
    this.threeFBO.setMaterial(this.gradientMaterial);
  }

  addFboDebugPlane() {
    // before we had a 2nd renderer/canvas, this would let us see the color map shader results
    // add debug plane
    // build shape
    let planeResolution = 1;
    this.debugPlaneGeometry = new THREE.PlaneGeometry(
      80,
      80,
      planeResolution,
      planeResolution
    );
    this.debugPlaneMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      wireframe: false,
      map: this.threeFBO.getTexture(),
      transparent: true,
    });
    this.debugPlane = new THREE.Mesh(
      this.debugPlaneGeometry,
      this.debugPlaneMaterial
    );
    this.debugPlane.position.set(0, 0, 0);
    this.scene.add(this.debugPlane);
  }

  buildParticles() {
    // build geometry for particles
    // const buffGeom = new THREE.CircleBufferGeometry( 1, 8 );
    const buffGeom = new THREE.PlaneGeometry(1, 1, 1);
    let geometry = new THREE.InstancedBufferGeometry();
    geometry.index = buffGeom.index;
    geometry.attributes = buffGeom.attributes;

    // create positions
    const particleCount = 100000;
    this.meshRadius = 200;
    this.meshDepth = 400;

    // create attributes arrays & assign to geometry
    const translateArray = new Float32Array(particleCount * 3);
    const colorUVArray = new Float32Array(particleCount * 2);
    // spehere helpers
    var inc = Math.PI * (3 - Math.sqrt(5));
    var x = 0;
    var y = 0;
    var z = 0;
    var r = 0;
    var phi = 0;
    var radius = 0.6;
    for (
      let i = 0, i2 = 0, i3 = 0, l = particleCount;
      i < l;
      i++, i2 += 2, i3 += 3
    ) {
      // random positions inside a unit cube
      translateArray[i3 + 0] = Math.random() * 2 - 1;
      translateArray[i3 + 1] = Math.random() * 2 - 1;
      translateArray[i3 + 2] = Math.random() * 2 - 1;

      // evenly-spread positions on a unit sphere surface
      // var off = 2 / particleCount;
      // y = i * off - 1 + off / 2;
      // r = Math.sqrt(1 - y * y);
      // phi = i * inc;
      // x = Math.cos(phi) * r;
      // z = (0, Math.sin(phi) * r);
      // x *= radius * Math.random(); // but vary the radius to not just be on the surface
      // y *= radius * Math.random();
      // z *= radius * Math.random();
      // translateArray[ i3 + 0 ] = x;
      // translateArray[ i3 + 1 ] = y;
      // translateArray[ i3 + 2 ] = z;

      // color map progress
      colorUVArray[i2 + 0] = i / particleCount;
      colorUVArray[i2 + 1] = 0.5;
    }

    geometry.setAttribute(
      "translate",
      new THREE.InstancedBufferAttribute(translateArray, 3)
    );
    geometry.setAttribute(
      "colorUV",
      new THREE.InstancedBufferAttribute(colorUVArray, 2)
    );

    this.material = new THREE.RawShaderMaterial({
      uniforms: {
        map: {
          value: new THREE.TextureLoader().load("../data/images/particle.png"),
        },
        colorMap: { value: this.threeFBO.getTexture() },
        time: { value: 0.0 },
      },
      vertexShader: `
        precision highp float;
        
        // THREE.js uniforms
        uniform mat4 modelMatrix;
        uniform mat4 modelViewMatrix;
        uniform mat3 normalMatrix;
        uniform mat4 projectionMatrix;

        // custom uniforms
        uniform float time;
        uniform sampler2D colorMap;

        attribute vec3 position;
        attribute vec2 uv;
        attribute vec3 translate;
        attribute vec2 colorUV;

        varying vec2 vUv;
        varying float vScale;
        varying vec2 vColorUV;

        void main() {
          vec4 mvPosition = modelViewMatrix * vec4( translate, 1.0 );

          // oscillate position w/trig
          vec3 trTime = vec3(translate.x + time, translate.y + time, translate.z + time);
          float scale = 2.0 + 1. * sin( trTime.x * 5. ) + sin( trTime.y * 3.2 ) + sin( trTime.z * 4.3 );
          vScale = scale;
          vec3 posOffset = vec3(
            3. * sin(trTime.x * 10.) + 10. * sin(time/15.),
            3. * sin(trTime.y * 10.) + 10. * sin(time/10.),
            3. * sin(trTime.z * 10.) + 10. * sin(time/5.)
          );

          // oscillate position w/color map
          vec4 diffuseColor = texture2D( colorMap, vUv );
          posOffset += vec3(
            3. + -0.5 + diffuseColor.r,
            3. + -0.5 + diffuseColor.g,
            3. + -0.5 + diffuseColor.b
          );

          // pass values to frag
          vUv = uv;
          vColorUV = colorUV;

          // set final vert position
          mvPosition.xyz += (position + posOffset) * scale;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        precision highp float;

        uniform sampler2D map;
        uniform sampler2D colorMap;

        varying vec2 vUv;
        varying float vScale;
        varying vec2 vColorUV;
        

        void main() {
          vec4 diffuseColor = texture2D( map, vUv );
          // vec4 diffuseColor2 = texture2D( colorMap, vUv );
          vec4 diffuseColor2 = texture2D( colorMap, vColorUV );
          gl_FragColor = vec4(diffuseColor2.rgb, diffuseColor.a);
        }
      `,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending, // handle z-stacking, instead of more difficult measures: https://discourse.threejs.org/t/threejs-and-the-transparent-problem/11553/7
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.scale.set(this.meshRadius, this.meshRadius, this.meshDepth);
    this.scene.add(this.mesh);
  }

  updateObjects() {
    // update shader
    const time = performance.now() * 0.0001;
    this.material.uniforms["time"].value = time;
    this.gradientMaterial.uniforms["time"].value = time;

    // rotate shape
    const cameraAmp = 0.3;
    if (!this.cameraXEase) {
      // lazy init rotation lerping
      this.cameraXEase = new EasingFloat(0, 0.08, 0.00001);
      this.cameraYEase = new EasingFloat(0, 0.08, 0.00001);
    }
    this.cameraYEase
      .setTarget(-cameraAmp + cameraAmp * 2 * this.pointerPos.xNorm(this.el))
      .update();
    this.cameraXEase
      .setTarget(-cameraAmp + cameraAmp * 2 * this.pointerPos.yNorm(this.el))
      .update();
    this.mesh.rotation.x = this.cameraXEase.value();
    this.mesh.rotation.y = this.cameraYEase.value();

    // move camera z
    this.mesh.position.set(0, 0, 0 + 200 * Math.sin(time * 2));
  }

  animate() {
    if (this.stats) this.stats.begin();
    this.updateObjects();
    this.threeFBO.render(this.threeScene.getRenderer());
    this.threeScene.render();
    requestAnimationFrame(() => this.animate());
    if (this.stats) this.stats.end();
  }

  resize() {
    this.threeScene.resize();
  }
}

if (window.autoInitDemo) window.demo = new ThreeSceneDemo(document.body);
