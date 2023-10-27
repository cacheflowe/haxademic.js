import DemoBase from "./demo--base.es6.js";
import * as THREE from "../vendor/three/three.module.js";
import FontUtil from "../src/font-util.es6.js";
import FrameLoop from "../src/frame-loop.es6.js";
import PointerPos from "../src/pointer-pos.es6.js";
import ThreeScene from "../src/three-scene-.es6.js";

class ThreeSceneTextTextureDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "ThreeScene | Text Texture",
      "three-scene-text-texture",
      "Custom textured shape w/dynamic canvas text"
    );
  }

  init() {
    this.el.setAttribute("style", "height: 500px;");
    this.injectCSS(`
      @font-face{
        font-family: Roboto-Black;
        src: url(../fonts/Roboto-Black.ttf) format("truetype");
        font-style: normal;
      }
      body {
        font-family: Roboto-Black;
      }
    `);
    // TODO: build canvases via cylinder object, update UVs to rotate & set final positions
    // setup
    this.pointerPos = new PointerPos();

    // wait for font to load
    FontUtil.fontLoadListener("Roboto-Black", () => this.onFontsLoaded());
    // document.fonts.load('1rem "Roboto-Black"').then(() => this.onFontsLoaded());
  }

  onFontsLoaded() {
    this.setupScene();
    this.addLights();
    this.buildCylinders();
    this.startAnimation();
  }

  setupScene() {
    this.threeScene = new ThreeScene(this.el, 0x000000); // ffdddd
    this.scene = this.threeScene.getScene();
  }

  addLights() {
    var ambientLight = new THREE.AmbientLight(0xffffff, Math.PI * 2);
    this.scene.add(ambientLight);
    // var ambientLight2 = new THREE.AmbientLight(0xffffff, 0.99);
    // this.scene.add(ambientLight2);
    // var pointLight = new THREE.PointLight(0x444444, 1, 0);
    // pointLight.position.set(-100, 100, 50);
    // this.scene.add(pointLight);
    var directionalLight = new THREE.DirectionalLight(0xffffff, Math.PI);
    directionalLight.position.set(0.3, 0, 1); // default: (0, 1, 0);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    var pointLight = new THREE.PointLight(0xffffff, 7, 500, 3);
    pointLight.position.set(0, 0, 300);
    pointLight.castShadow = true;
    this.scene.add(pointLight);
  }

  buildCylinders() {
    this.cylinders = [
      new TextCylinder("NO", 60, 156, 12, 1, 0.01),
      new TextCylinder("RULES", 0, 156, 7, -1, 0),
      new TextCylinder("2020", -60, 156, 9, 2, -0.01),
    ];
    this.cylinders.forEach((el) => el.addToScene(this.scene));
  }

  startAnimation() {
    let frames = 200;
    // super.initRecording(this.threeScene.canvasEl(), frames, 1, 30);
    window._frameLoop = new FrameLoop(frames, 4).addListener(this);
  }

  frameLoop(frameCount) {
    this.cylinders.forEach((el) => el.update());
    this.threeScene.render();
    super.renderVideo();
  }
}

class TextCylinder {
  constructor(text, yOffset, radius, textureZoomX, textureOffsetSpeedX, rotX) {
    // store props
    this.text = text;
    this.yOffset = yOffset;
    this.radius = radius;
    this.textureZoomX = textureZoomX;
    this.textureOffsetSpeedX = textureOffsetSpeedX;
    this.rotX = rotX;
    // build texture & mesh
    this.createTexture();
    this.buildMesh();
  }

  addToScene(scene) {
    scene.add(this.mesh);
  }

  update() {
    // update shape
    // this.mesh.rotation.y = -0.5 + this.pointerPos.xNorm(this.el);
    // this.mesh.rotation.x = -0.5 + this.pointerPos.yNorm(this.el);
    this.updateUVs();
  }

  createTexture() {
    // create canvas
    this.canvasWord = document.createElement("canvas");
    this.canvasWord.setAttribute("width", "512");
    this.canvasWord.setAttribute("height", "512");
    var ctx = this.canvasWord.getContext("2d");
    // resize to fit word
    this.setCanvasTextProps(ctx);
    this.canvasWord.setAttribute(
      "width",
      Math.round(ctx.measureText(this.text).width) + 100
    );
    // clear black
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(0, 0, this.canvasWord.width, this.canvasWord.height); // clearRect
    // draw text
    this.setCanvasTextProps(ctx);
    ctx.fillText(
      this.text,
      this.canvasWord.width / 2,
      this.canvasWord.height * 0.55
    );
    // create THREE texture from canvas
    this.canvasTexture = new THREE.Texture(this.canvasWord);
    this.canvasTexture.needsUpdate = true;
    // attach to DOM for debugging
    // setTimeout(() => document.body.appendChild(this.canvasWord), 100);
  }

  setCanvasTextProps(ctx) {
    ctx.fillStyle = "rgba(255,255,255,1)";
    ctx.font = "bold 370px Roboto-Black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
  }

  buildMesh() {
    // build shape
    let height = 40;
    this.meshGeometry = new THREE.CylinderGeometry(
      this.radius,
      this.radius,
      height,
      500,
      1,
      true
    );
    this.meshMaterial = new THREE.MeshLambertMaterial({
      color: 0x888888,
      side: THREE.DoubleSide,
      wireframe: false,
      emissive: 0x000000, // 0x000000
      // specular : 0x000000,
      map: this.canvasTexture,
      // shininess : 10,
      // transparent: true,
      // opacity: 0.8,
    });
    this.mesh = new THREE.Mesh(this.meshGeometry, this.meshMaterial);
    this.mesh.receiveShadow = true;
    this.mesh.position.set(0, this.yOffset, 0);
    this.mesh.rotation.set(this.rotX, 0, 0);

    // prep material
    this.canvasTexture.wrapS = THREE.RepeatWrapping;
    this.canvasTexture.wrapT = THREE.RepeatWrapping;
    this.textureZoom = { x: this.textureZoomX, y: 0.8 };
    this.textureOffset = { x: 0, y: 0.12 };
  }

  updateUVs() {
    // update canvas texture
    this.textureOffset.x = _frameLoop.getProgress() * this.textureOffsetSpeedX;
    this.canvasTexture.offset.set(this.textureOffset.x, this.textureOffset.y);
    this.canvasTexture.repeat.set(this.textureZoom.x, this.textureZoom.y);
  }
}

if (window.autoInitDemo)
  window.demo = new ThreeSceneTextTextureDemo(document.body);
