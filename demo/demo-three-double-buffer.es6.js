import DemoBase from './demo--base.es6.js';
import * as THREE from '../vendor/three/three.module.js';
import FrameLoop from '../src/frame-loop.es6.js';
import ThreeScenePlane from '../src/three-scene-plane.es6.js';
import ThreeDoubleBuffer from '../src/three-double-buffer.es6.js';

class ThreeDoubleBufferDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [], 'ThreeScene | ThreeDouble Buffer', 'three-scene-double-buffer', 'A basic double buffer helper.', false);
  }

  init() {
    // build threejs scene and add to DOM
    this.threeScene = new ThreeScenePlane(512, 256, 0xff0000, true);
    this.el.appendChild(this.threeScene.canvasEl());

    // build
    this.buildDoubleBuffer();
    window._frameLoop = (new FrameLoop()).addListener(this);
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
        gl_FragColor = finalColor;
      }
    `;

    this.offset = new THREE.Vector2(0, 0);
    let bufferMaterial = new THREE.ShaderMaterial( {
      uniforms: {
        lastFrame: { type: "t", value: null },
        imgTex : { type: "t", value: new THREE.TextureLoader().load('../images/checkerboard-16-9.png') },
        // imgTex : { type: "t", value: new THREE.TextureLoader().load('../data/images/bb.jpg') },
        res : {type: "v2", value: new THREE.Vector2(this.threeScene.getWidth(), this.threeScene.getHeight())},
        time: {type: "f", value: 0},
        zoom: {type: "f", value: 1},
        rotation: {type: "f", value: 0},
        mixOriginal: {type: "f", value: 0},
        offset: {type: "v2", value: this.offset},
      }, 
      fragmentShader: fshader
    });
    this.doubleBuffer = new ThreeDoubleBuffer(this.threeScene.getWidth(), this.threeScene.getHeight(), bufferMaterial);

    // add double buffer plane to main THREE scene
    this.threeScene.getScene().add(this.doubleBuffer.displayMesh);
  }

  frameLoop(frameCount) {
    // update uniforms & re-render double buffer
    for(let i=0; i < 5; i++) {
      this.doubleBuffer.setUniform('time', window._frameLoop.count(0.001));
      this.doubleBuffer.setUniform('rotation', _frameLoop.osc(0.01, -0.001, 0.001));
      this.doubleBuffer.setUniform('zoom', _frameLoop.osc(0.01, 0.998, 1.002));
      // this.offset.x = _frameLoop.osc(0.01, -0.001, 0.001);
      this.offset.y = 1;// _frameLoop.osc(0.01, -0.002, 0.002);
      this.doubleBuffer.setUniform('mixOriginal', _frameLoop.osc(0.01, 0, 0.01));
      this.doubleBuffer.render(this.threeScene.getRenderer());
    }
    this.threeScene.render();
  }

}

if(window.autoInitDemo) window.demo = new ThreeDoubleBufferDemo(document.body);
