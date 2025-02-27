import * as PIXI from "../vendor/pixi/pixi.mjs";
import DemoBase from "./demo--base.js";
import PixiStage from "../src/pixi-stage.js";
import VideoUtil from "../src/video-util.js";

class PixiStageTexturedMeshGlobeDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      null,
      "PixiStage | Textured Mesh Globe",
      "pixi-stage-textured-mesh-globe-container",
      "Warped video mesh for spherical projection"
    );
  }

  init() {
    // create PIXI stage object
    this.el.setAttribute("style", "height: 500px;");
    this.pixiStage = new PixiStage(this.el, 0xff000000);

    // load image before building other objects
    // this.buildTestTexture();
    this.loadVideo();
  }

  buildTestTexture() {
    this.texture = PixiStage.newTestPatternTexture(
      this.pixiStage.renderer(),
      this.pixiStage.width(),
      this.pixiStage.height()
    );
    this.buildMesh(this.texture);
    this.animate();
  }

  loadVideo() {
    // add video element
    let videoPath = "../data/videos/wash-your-hands-512.mp4";
    this.videoEl = VideoUtil.buildVideoEl(videoPath, true);
    // this.videoEl.play();

    // attch backing video element to DOM for debug view
    this.videoEl.style.setProperty("width", "320px"); // for debug view
    this.videoEl.style.setProperty("border", "1px solid #090");
    document.body.appendChild(this.videoEl);

    this.texture = PIXI.Texture.from(this.videoEl);
    this.texture.once("update", (texture) => {
      // use `once` instead of `on`, since event can fire twice. this is noted in the PIXI docs
      this.buildMesh(texture);
      this.animate();
    });
  }

  buildMesh(texture) {
    // arrange vertices
    // set shape size & detail
    let shapeW = this.pixiStage.width(); // UI.value(displayW);
    let shapeH = this.pixiStage.height() * 1; // UI.value(displayH);
    let detail = 2000; // UI.value(detailVal);
    let shapeOriginX = shapeW / 2;
    let shapeOriginY = shapeH;
    let startU = 0; // UI.value(offsetX);

    // create vertex & uvs
    var vertices = new Float32Array(detail * 3);
    var vI = 0;
    var meshuv = new Float32Array(detail * 3);
    var uVI = 0;
    // create triangle indexes (i1, i2, i3) referencing indexes in the other two arrays
    var meshi = new Uint16Array(detail);
    for (let i = 0; i < meshi.length; i++) {
      meshi[i] = i;
    }

    // build fan
    let startRads = Math.PI;
    let segmentRads = (Math.PI / detail) * 3.01;
    for (var i = 0; i < detail; i++) {
      let x = Math.cos(startRads + i * segmentRads);
      let y = Math.sin(startRads + i * segmentRads);
      let xNext = Math.cos(startRads + (i + 1) * segmentRads);
      let yNext = Math.sin(startRads + (i + 1) * segmentRads);
      let progressX = (i / detail) * 3;
      let progressXNext = ((i + 1) / detail) * 3;
      let u = startU + progressX; // texture wraps around half the circle instead of full circle, so speed up UV by multiplying by 2
      let uNext = startU + progressXNext;

      vertices[vI++] = (x * shapeW) / 2;
      vertices[vI++] = y * shapeH;
      meshuv[uVI++] = u;
      meshuv[uVI++] = 0;
      vertices[vI++] = (xNext * shapeW) / 2;
      vertices[vI++] = yNext * shapeH;
      meshuv[uVI++] = uNext;
      meshuv[uVI++] = 0;
      vertices[vI++] = 0;
      vertices[vI++] = 0;
      meshuv[uVI++] = u;
      meshuv[uVI++] = 1;
    }

    // create the mesh object
    this.mesh = new PIXI.SimpleMesh(
      texture,
      vertices,
      meshuv,
      meshi,
      PIXI.DRAW_MODES.TRIANGLES
    );
    this.mesh.position.set(shapeOriginX, shapeOriginY);

    // set texture repeat & PIXI batch size
    this.pixiStage.container().addChild(this.mesh);
    PIXI.Mesh.BATCHABLE_SIZE = this.mesh.vertexData.length; // need to set the batchable size if we want to update vertices & uvs beyond the default of 100
    texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT; // texture repating
    // this.mesh.drawMode = PIXI.DRAW_MODES.LINE_STRIP;       // wireframe?!
  }

  animate() {
    // start PIXI frame loop
    this.frameCount = 0;
    this.pixiStage.addFrameListener(() => this.draw());
  }

  draw() {
    this.frameCount++;
  }
}

if (window.autoInitDemo)
  window.demo = new PixiStageTexturedMeshGlobeDemo(document.body);
