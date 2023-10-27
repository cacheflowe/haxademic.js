import DemoBase from "./demo--base.es6.js";
import * as THREE from "../vendor/three/three.module.js";
import Stats from "../vendor/stats.module.js";
import EasingFloat from "../src/easing-float.es6.js";
import PointerPos from "../src/pointer-pos.es6.js";
import MobileUtil from "../src/mobile-util.es6.js";
import ThreeDoubleBuffer from "../src/three-double-buffer.es6.js";
import ThreeScene from "../src/three-scene-.es6.js";
import ThreeSceneFBO from "../src/three-scene-fbo.es6.js";
import FrameLoop from "../src/frame-loop.es6.js";

class ThreeSceneDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "ThreeSceneFbo | GPU Particles",
      "three-scene-gpu-particles",
      "One particle per pixel position.",
      true
    );
  }

  init() {
    this.simSize = 256;
    this.setupInput();
    this.setupScene();
    this.buildStats();
    this.buildColorMapFbo();
    this.buildParticles();
    this.buildDoubleBuffer();
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
    window._frameLoop = new FrameLoop();
    this.animate();
    window.addEventListener("resize", () => this.resize());
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 400);
  }

  buildColorMapFbo() {
    // build FBO and debug renderer
    this.gradientFBO = new ThreeSceneFBO(512, 8, 0x00ffff);

    // add debug renderer to DOM
    this.addRendererToDOM(this.gradientFBO, 300, 32);

    // create shader material
    this.gradientMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
      },
      vertexShader: ThreeSceneFBO.defaultVertShader,
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
    this.gradientFBO.setMaterial(this.gradientMaterial);
  }

  buildDoubleBuffer() {
    let fshader = `
      uniform vec2 res;
      uniform sampler2D lastFrame; 
      uniform sampler2D imgTex;
      uniform float time;
      uniform float zoom;
      uniform float rotation;
      uniform float mixOriginal;
      uniform vec2 offset;

      #define PI 3.14159265359
      #define HALF_PI 1.57079632675
      #define TWO_PI 6.283185307

      // Simplex 2D noise
      //
      vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
          dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }
      
      void main() {
        vec2 texel = 1. / res;

        // get orig color
        vec2 vUvOrig = gl_FragCoord.xy / res;
        vec4 imgColor = texture2D(imgTex, vUvOrig);

        // apply zoom & rotate displacement
        vec2 vUv = gl_FragCoord.xy / res;
        vUv -= 0.5; // center coords
        vUv *= zoom;
        vUv *= mat2(cos(rotation), sin(rotation), -sin(rotation), cos(rotation));
        vUv += 0.5; // reset from centering
        vec4 lastFrameZoomed = texture2D(lastFrame, vUv + offset);

        // mix soomed with original 
        vec4 finalColor = mix(lastFrameZoomed, imgColor, mixOriginal);
        finalColor = lastFrameZoomed; // override mix with test pattern
        
        // add color & loop
        float noiseZoom = 1.85;
        float posX = finalColor.r;
        float posY = finalColor.g;
        float noiseOffset = snoise(vec2(time/10. + vUvOrig.x * 0.1, time/10. + vUvOrig.y * 0.1));
        float noiseVal = snoise(vec2(noiseOffset + vUvOrig.x * 0.85 + posX * noiseZoom, noiseOffset + vUvOrig.y * 0.85 + posY * noiseZoom));
        float heading = noiseVal * TWO_PI * 5.;
        float speed = 0.001 + 0.001 * (vUvOrig.x + vUvOrig.y);
        finalColor.r += speed * cos(heading); // 0.001 + noiseVal * 0.012;
        finalColor.g += speed * sin(heading); // 0.001 + noiseVal * 0.008;
        finalColor.b += sin(noiseVal * 40.) * 0.003;
        if(finalColor.r > 1. || finalColor.g > 1. || finalColor.b > 1.) finalColor = vec4(vec3(0.5), 1.);
        if(finalColor.r < 0. || finalColor.g < 0. || finalColor.b < 0.) finalColor = vec4(vec3(0.5), 1.);

        // set final color
        gl_FragColor = finalColor;
      }
    `;

    this.offset = new THREE.Vector2(0, 0);
    let bufferMaterial = new THREE.ShaderMaterial({
      uniforms: {
        lastFrame: { type: "t", value: null },
        imgTex: {
          type: "t",
          value: new THREE.TextureLoader().load(
            "../images/checkerboard-16-9.png"
          ),
        },
        res: {
          type: "v2",
          value: new THREE.Vector2(this.simSize, this.simSize),
        },
        time: { type: "f", value: 0 },
        zoom: { type: "f", value: 1 },
        rotation: { type: "f", value: 0 },
        mixOriginal: { type: "f", value: 0.1 },
        offset: { type: "v2", value: this.offset },
      },
      fragmentShader: fshader,
    });
    this.doubleBuffer = new ThreeDoubleBuffer(
      this.simSize,
      this.simSize,
      bufferMaterial,
      true
    );

    // add double buffer plane to main THREE scene
    this.scene.add(this.doubleBuffer.displayMesh);
    this.doubleBuffer.displayMesh.scale.set(0.2, 0.2, 0.2);

    // add debug rednerer & add to DOM
    if (this.debugRender) {
      this.debugRenderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: false,
      });
      this.debugRenderer.setClearColor(0xff000000, 0);
      this.debugRenderer.setPixelRatio(window.devicePixelRatio || 1);
      this.debugRenderer.setSize(this.simSize, this.simSize);
      this.debugEl.appendChild(this.debugRenderer.domElement);
    }
  }

  updateSimulation() {
    // update uniforms & re-render double buffer
    // for(let i=0; i < 5; i++) {
    this.doubleBuffer.setUniform("time", _frameLoop.count(0.001));
    // this.doubleBuffer.setUniform('rotation', _frameLoop.osc(0.03, -0.003, 0.003));
    // this.doubleBuffer.setUniform('zoom', _frameLoop.osc(0.02, 0.998, 1.004));
    // this.offset.x = _frameLoop.osc(0.01, -0.001, 0.001);
    // this.offset.y = 0.001;// _frameLoop.osc(0.01, -0.002, 0.002);
    this.doubleBuffer.setUniform("mixOriginal", _frameLoop.osc(0.03, 0, 0.004));
    this.doubleBuffer.render(this.threeScene.getRenderer(), this.debugRenderer);
    // }
  }

  addRendererToDOM(fbo, w, h) {
    let canvas = fbo.addDebugCanvas();
    this.debugEl.appendChild(canvas);
    canvas.style.setProperty("width", `${w}px`);
    canvas.style.setProperty("height", `${h}px`);
    canvas.style.setProperty("border", "2px solid #000");
    canvas.style.setProperty("box-sizing", "border-box");
    canvas.style.setProperty("margin-right", "1rem");
  }

  buildParticles() {
    // build geometry for particles
    // const buffGeom = new THREE.CircleBufferGeometry( 1, 8 );
    const buffGeom = new THREE.PlaneGeometry(1, 1, 1);
    let geometry = new THREE.InstancedBufferGeometry();
    geometry.index = buffGeom.index;
    geometry.attributes = buffGeom.attributes;

    // create positions
    const particleCount = this.simSize * this.simSize;
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

      // grid layout
      translateArray[i3 + 0] = -1 + 2 * ((i % this.simSize) / this.simSize);
      translateArray[i3 + 1] =
        -1 + 2 * (Math.floor(i / this.simSize) / this.simSize);
      translateArray[i3 + 2] = 0;

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
      colorUVArray[i2 + 0] = (i % this.simSize) / this.simSize; // i/particleCount;
      colorUVArray[i2 + 1] = Math.floor(i / this.simSize) / this.simSize; // 0.5
    }

    geometry.setAttribute(
      "translate",
      new THREE.InstancedBufferAttribute(translateArray, 3)
    );
    geometry.setAttribute(
      "colorUV",
      new THREE.InstancedBufferAttribute(colorUVArray, 2)
    );

    this.particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        map: {
          value: new THREE.TextureLoader().load("../data/images/particle.png"),
        },
        colorMap: { value: this.gradientFBO.getTexture() },
        positionsMap: { value: null },
        time: { value: 0.0 },
      },
      vertexShader: `
        precision mediump float;

        // custom uniforms
        uniform float time;
        uniform sampler2D colorMap;
        uniform sampler2D positionsMap;

        attribute vec3 translate;
        attribute vec2 colorUV;

        varying vec2 vUv;
        varying float vScale;
        varying vec2 vColorUV;

        float map(float value, float low1, float high1, float low2, float high2) {
          return low2 + (value - low1) * (high2 - low2) / (high1 - low1);
        }

        void main() {
          // get map position from double buffer
          vec4 mapPosition = texture2D(positionsMap, colorUV);
          vec3 meshScale = vec3(2.0, 2.0, 1.0);
          vec3 posOffset = vec3(
            (-0.5 + mapPosition.x) * meshScale.x, 
            (-0.5 + mapPosition.y) * meshScale.y, 
            (-0.5 + mapPosition.z) * meshScale.z
          );

          // apply offset within modelViewMatrix multiplication
          // for correct inheritance of mesh position/rotation. 
          // doing this afterwards was losing coordinate system rotation
          // vec4 mvPosition = modelViewMatrix * vec4( translate + posOffset, 1.0 );
          vec4 mvPosition = modelViewMatrix * vec4( translate*0.01 + posOffset, 1.0 );

          // wrap offsets with a fade
          float scale = 2.0;
          if(mapPosition.x > 0.8) scale = min(scale, map(mapPosition.x, 0.8, 1., scale, 0.));
          if(mapPosition.x < 0.2) scale = min(scale, map(mapPosition.x, 0.2, 0., scale, 0.));
          if(mapPosition.y > 0.8) scale = min(scale, map(mapPosition.y, 0.8, 1., scale, 0.));
          if(mapPosition.y < 0.2) scale = min(scale, map(mapPosition.y, 0.2, 0., scale, 0.));
          if(mapPosition.z > 0.8) scale = min(scale, map(mapPosition.z, 0.8, 1., scale, 0.));
          if(mapPosition.z < 0.2) scale = min(scale, map(mapPosition.z, 0.2, 0., scale, 0.));

          // set final vert position
          mvPosition.xyz += (position + posOffset) * scale;
          gl_Position = projectionMatrix * mvPosition;

          // pass values to frag
          vUv = uv;
          vColorUV = colorUV;
          vScale = scale;
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
          // tint the particle texture but keep the particle texture alpha
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

    this.mesh = new THREE.Mesh(geometry, this.particleMaterial);
    this.mesh.scale.set(this.meshRadius, this.meshRadius, this.meshDepth);
    this.scene.add(this.mesh);
  }

  updateObjects() {
    // update shader
    const time = performance.now() * 0.0001;
    this.particleMaterial.uniforms["time"].value = time;
    this.particleMaterial.uniforms["positionsMap"].value =
      this.doubleBuffer.getTexture();
    this.gradientMaterial.uniforms["time"].value = time;

    // rotate shape
    const cameraAmp = 2;
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
    // this.mesh.position.set(0, 0, 0 + 200 * Math.sin(time*2));
  }

  animate() {
    if (this.stats) this.stats.begin();
    this.updateObjects();
    this.updateSimulation();
    this.gradientFBO.render(this.threeScene.getRenderer());
    this.threeScene.render();
    requestAnimationFrame(() => this.animate());
    if (this.stats) this.stats.end();
  }

  resize() {
    this.threeScene.resize();
  }
}

if (window.autoInitDemo) window.demo = new ThreeSceneDemo(document.body);
