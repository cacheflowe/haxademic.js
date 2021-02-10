import DemoBase from './demo--base.es6.js';
import * as THREE from '../vendor/three/three.module.js';
import MathUtil from '../src/math-util.es6.js';
import PointerPos from '../src/pointer-pos.es6.js';
import ThreeScene from '../src/three-scene-.es6.js';

class ThreeSceneTexturedShapeDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [], `
      <div class="container">
        <h1>ThreeScene | Textured shape UV animation</h1>
        <p>Custom textured shape w/UV & vertex displacement on the CPU</p>
        <div id="three-scene" class="fullscreen-bg"></div>
      </div>
    `);
  }

  init() {
    // setup
    this.el = document.getElementById('three-scene');
    this.pointerPos = new PointerPos();
    this.setupScene();
    this.addLights();
    this.buildShape();
    this.startAnimation();
  }

  setupScene() {
    this.threeScene = new ThreeScene(this.el, 0xffdddd);
    this.scene = this.threeScene.getScene();
    this.camera = this.threeScene.getCamera();
  }

  addLights() {
    var ambientLight = new THREE.AmbientLight(0x999999, 0.8);
    this.scene.add(ambientLight);
    var pointLight = new THREE.PointLight(0x444444, 1, 0);
    pointLight.position.set(-100, 100, 50);
    // this.scene.add(pointLight);
    var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.95 );
    directionalLight.position.set(1, 0, 1); // default: (0, 1, 0);
    this.scene.add( directionalLight );
  }

  startAnimation() {
    this.frameCount = 0;
    this.animate();
    window.addEventListener('resize', () => this.resize());
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 400);
  }

  buildShape() {
    // build shape
    // this.planeGeometry = new THREE.PlaneGeometry(2000, 260, 800, 1);
    this.planeGeometry = new THREE.CylinderGeometry(100, 100, 100, 200, 1, true);
    this.planeMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      wireframe: false,
      emissive : 0x330000,
      specular : 0x333355,
      shininess : 10,
      // transparent: true,
      // opacity: 0.8,
      // alphaTest: 0.35,
      // map: new THREE.TextureLoader().load('../images/cacheflowe-logo-trans-white.png'),
    });
    this.plane = new THREE.Mesh( this.planeGeometry, this.planeMaterial );

    // load texture
    this.materialLoaded = false;
    let loader = new THREE.TextureLoader();
    let texture = loader.load(
      // '../images/cacheflowe-logo-trans-white.png',
      '../images/checkerboard-16-9.png',
      (texture) => {  // load success
        // set texture repeat props
        this.textureZoom = {x: 1, y: 1};
        this.textureOffset = {x: 0, y: 0};
        this.textureRotation = 0;
        this.textureOffsetAmp = 0;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.center.set(0.5, 0.5);
        texture.repeat.set(this.textureZoom.x, this.textureZoom.y);

        // add material to geometry
        this.plane.material.map = texture;
        this.plane.material.map.needsUpdate = true;
        this.scene.add(this.plane);
        this.materialLoaded = true;

        // copy original buffered geometry data
        this.geometryOrig = this.planeGeometry.clone(); 
        console.log(this.geometryOrig);
      },
      undefined,    // no progress callback
      (error) => {  // load error
        console.log('Couldn\'t load plane texture!');
      }
    );
  }

  updateUVs() {
    if(!this.materialLoaded) return;
    let texture = this.plane.material.map;

    // update offset amp & rotation
    this.textureOffsetAmp = 0.25 + 0.25 * Math.sin(this.frameCount/220);
    this.textureRotation = 0.3 * Math.sin(this.frameCount/220);

    // oscillate UVs & vertices
    var vertIndex = 0;
    var positionArrayCur = this.planeGeometry.attributes.position.array;
    var positionArrayOrig = this.geometryOrig.attributes.position.array;
    var uvArrayCur = this.planeGeometry.attributes.uv.array;
    var uvArrayOrig = this.geometryOrig.attributes.uv.array;
    for(let i=0; i < uvArrayOrig.length; i+=2) {
      // displace from original UVs
      let vIndex = vertIndex * 3;
      let x = positionArrayOrig[vIndex + 0];
      let y = positionArrayOrig[vIndex + 1];
      let z = positionArrayOrig[vIndex + 2];
      let u = uvArrayOrig[i];
      let v = uvArrayOrig[i+1];
      uvArrayCur[i] = u + this.textureOffsetAmp * (0.5 + 0.5 * Math.sin(x/100 + this.frameCount/100));
      uvArrayCur[i+1] = v + this.textureOffsetAmp * (0.5 + 0.5 * Math.sin(y/100 + this.frameCount/120));
      vertIndex++;
    }

    // oscillate vertices. this is lame
    for(let i=0; i < positionArrayCur.length; i+=3) {
      let x = positionArrayOrig[i + 0];
      let y = positionArrayOrig[i + 1];
      let z = positionArrayOrig[i + 2];
      // displace from original vertices
      positionArrayCur[i + 0] = x;
      positionArrayCur[i + 1] = y + 6. * Math.sin(z/200*MathUtil.TWO_PI*2 + this.frameCount/10.);
      positionArrayCur[i + 2] = z + 10. * Math.sin(x/400 + this.frameCount/10.);
    };

    // update!

    // update zoom
    this.textureZoom.x = 2;// + 1. * Math.sin(this.frameCount/120);
    this.textureZoom.y = 4;// + 1. * Math.sin(this.frameCount/50);

    // update offset
    this.textureOffset.x = this.frameCount/160; // + 0.1 * Math.sin(this.frameCount/10);
    this.textureOffset.y = 0.1 * Math.sin(this.frameCount/20);

    // set texture props
    texture.offset.set(this.textureOffset.x, this.textureOffset.y);
    texture.repeat.set(this.textureZoom.x, this.textureZoom.y);
    // texture.rotation = this.textureRotation;
    
    // set dirty flags
    this.planeGeometry.attributes.uv.needsUpdate = true;
    this.planeGeometry.attributes.position.needsUpdate = true;
  }

  updateObjects() {
    // cube
    this.plane.rotation.y = Math.PI + -0.5 + this.pointerPos.xNorm(this.el);
    this.plane.rotation.x = -0.5 + this.pointerPos.yNorm(this.el);

    // update plane props
    this.updateUVs();
  }

  animate() {
    this.updateObjects();
    this.threeScene.render();
    this.frameCount++;
    requestAnimationFrame(() => this.animate());
  }

  resize() {
    this.threeScene.resize();
  }

}

if(window.autoInitDemo) window.demo = new ThreeSceneTexturedShapeDemo(document.body);
