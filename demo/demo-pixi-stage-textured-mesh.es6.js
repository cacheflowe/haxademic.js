import * as PIXI from "../vendor/pixi/pixi.mjs";
import DemoBase from "./demo--base.es6.js";
import PixiStage from "../src/pixi-stage.es6.js";

class PixiStageTexturedMeshDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [
        //  '!../vendor/pixi/pixi.min.js'
      ],
      "PixiStage | Textured Mesh",
      "pixi-stage-textured-mesh-container"
    );
  }

  init() {
    // create PIXI stage object
    this.pixiContainer = document.getElementById(
      "pixi-stage-textured-mesh-container"
    );
    this.pixiContainer.setAttribute("style", "height: 500px;");
    this.pixiStage = new PixiStage(this.pixiContainer, 0xffff0000);

    // load image before building other objects
    this.buildTexture();
    // this.loadImage();
  }

  buildTexture() {
    const graphics = new PIXI.Graphics();

    // bg
    graphics.beginFill(0x000000);
    graphics.drawRect(0, 0, this.pixiStage.width(), this.pixiStage.height());
    graphics.endFill();
    // checkers
    let rectSize = 20;
    var boxCount = 0;
    for (var x = 0; x < this.pixiStage.width(); x += rectSize) {
      for (var y = 0; y < this.pixiStage.height(); y += rectSize) {
        if (boxCount % 2 == 0) {
          graphics.beginFill(0xffffff);
          graphics.drawRect(x, y, rectSize, rectSize);
          graphics.endFill();
        }
        boxCount++;
      }
    }

    this.texture = this.pixiStage.graphicsToTexture(graphics);
    this.buildMesh(this.texture);
    this.animate();
  }

  loadImage() {
    // load image & init after
    this.texture = new PIXI.Texture.from("../images/checkerboard-16-9.png");
    this.texture.once("update", (texture) => {
      // use `once` instead of `on`, since event can fire twice. this is noted in the PIXI docs
      this.buildMesh(texture);
      this.animate();
    });
  }

  buildMesh(texture) {
    // build mesh. requires at least 2 rows/cols
    this.mesh = new PIXI.SimplePlane(texture, 128, 64);
    this.mesh.pivot.set(this.mesh.width * 0.5, this.mesh.height * 0.5);
    this.mesh.position.set(
      this.pixiStage.width() * 0.5,
      this.pixiStage.height() * 0.5
    );
    // this.mesh.width = this.pixiStage.width();
    // this.mesh.height = this.pixiStage.height();
    this.pixiStage.container().addChild(this.mesh);

    // make a copy of the original vertices
    this.meshVerticesOrig = Float32Array.from(this.mesh.vertexData); // make a copy of the original verts

    // set texture repeat & PIXI batch size
    PIXI.Mesh.BATCHABLE_SIZE = this.mesh.vertexData.length; // need to set the batchable size if we want to update vertices & uvs beyond the default of 100
    texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT; // texture repating
    // window.mesh.drawMode = PIXI.DRAW_MODES.LINE_STRIP      // wireframe?!
  }

  animate() {
    // start PIXI frame loop
    this.frameCount = 0;
    this.pixiStage.addFrameListener(() => this.draw());
  }

  draw() {
    this.frameCount++;

    // make mesh wave
    const vertices = this.mesh.vertexData;
    const uvs = this.mesh.uvs;
    const numVertices = this.mesh.vertexData.length;
    for (let i = 0; i < vertices.length; i += 2) {
      // vertices array are groups of 2. no 3d :)
      const vertX = this.meshVerticesOrig[i + 0];
      const vertY = this.meshVerticesOrig[i + 1];
      let xOffset = vertX + 10 * Math.sin(vertY / 36 + this.frameCount / 20);
      let yOffset = vertY + 10 * Math.sin(vertX / 36 + this.frameCount / 20);
      vertices[i + 0] = xOffset;
      vertices[i + 1] = yOffset;
      if (uvs) uvs[i] += 0.0005; // scroll x.. uvs might not be built until after first render!
    }
  }
}

if (window.autoInitDemo)
  window.demo = new PixiStageTexturedMeshDemo(document.body);
