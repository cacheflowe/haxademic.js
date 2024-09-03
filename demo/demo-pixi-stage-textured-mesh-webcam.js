import * as PIXI from "../vendor/pixi/pixi.mjs";
import DemoBase from "./demo--base.js";
import MathUtil from "../src/math-util.js";
import PixiStage from "../src/pixi-stage.js";

class PixiStageTexturedMeshDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      null,
      "PixiStage | TilingSprite",
      "pixi-stage-textured-mesh-container",
      "A custom TilingSprite array with animated vertices and UV coords"
    );
  }

  init() {
    // set canvas size by aspect ratio
    let bounds = this.el.getBoundingClientRect();
    let height = Math.round(bounds.width * (9 / 16));
    this.el.setAttribute("style", `height: ${height}px;`);
    this.pixiStage = new PixiStage(this.el, 0xff000000);

    // build texture to display
    // this.buildTexture();
    this.loadImage();
  }

  buildTexture() {
    this.texture = PixiStage.newTestPatternTexture(
      this.pixiStage.renderer(),
      this.pixiStage.width(),
      this.pixiStage.height()
    );
    this.buildMesh(this.texture);
    this.animate();
  }

  loadImage() {
    // load image & init after
    this.texture = PIXI.Texture.from("../data/images/bb.jpg");
    this.texture.once("update", (texture) => {
      // use `once` instead of `on`, since event can fire twice. this is noted in the PIXI docs
      this.buildMesh(texture);
      this.animate();
    });
  }

  buildMesh(texture) {
    // BUILD A GRID OF MESHES HERE, WITH A HELPER TO SET UV COORDS AND SIZE/POSITION OF MESHES
    // get canvas dimensions
    let w = this.pixiStage.width();
    let h = this.pixiStage.height();

    // match image scale to PIXI canvas scale for tiling
    this.baseTileScale = w / texture.baseTexture.width;

    this.sprites = [];

    // build grid
    let mult = 2;
    this.cols = 16 * mult;
    this.rows = 9 * mult;
    let cellW = w / this.cols;
    let cellH = h / this.rows;
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        let curX = x * cellW;
        let curY = y * cellH;
        let sprite = new PIXI.TilingSprite(texture, cellW, cellH);
        sprite.anchor.set(0, 0);
        sprite.position.set(curX, curY);
        sprite.tilePosition.set(w - curX, h - curY); // TODO - why is this seemingly reversed???
        sprite.tilePositionOrig = {
          x: sprite.tilePosition.x,
          y: sprite.tilePosition.y,
        };
        sprite.gridX = x;
        sprite.gridY = y;
        sprite.tileScale.set(this.baseTileScale, this.baseTileScale);
        this.sprites.push(sprite);
        this.pixiStage.container().addChild(sprite);
      }
    }

    // build grid
    let cols = 8;
    let rows = 4;
    cellW = w / cols;
    cellH = h / rows;
    let scaleAdj = 3;
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        let curX = x * cellW;
        let curY = y * cellH;
        let sprite = new PIXI.TilingSprite(texture, cellW, cellH);
        sprite.anchor.set(0, 0);
        sprite.position.set(curX, curY);
        sprite.tilePosition.set((w - curX) * scaleAdj, (h - curY) * scaleAdj); // TODO - why is this seemingly reversed???
        sprite.tilePositionOrig = {
          x: sprite.tilePosition.x,
          y: sprite.tilePosition.y,
        };
        sprite.gridX = x;
        sprite.gridY = y;
        sprite.tileScale.set(
          this.baseTileScale * scaleAdj,
          this.baseTileScale * scaleAdj
        );
        // if (Math.random() > 0.7) {
        //   this.sprites.push(sprite);
        //   this.pixiStage.container().addChild(sprite);
        // }
        if (Math.random() > 0.7) {
          // TODO: add tint filter here
          // let adj = new PIXI.
          // sprite.filters = [adj];
        }
      }
    }

    // texture repating - might not need this!
    // texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
  }

  animate() {
    // start PIXI frame loop
    this.frameCount = 0;
    this.pixiStage.addFrameListener(() => this.draw());
  }

  gridXFromIndex(index, detail) {
    return index % detail;
  }

  gridYFromIndex(index, detail) {
    return Math.floor(index / detail);
  }

  draw() {
    this.frameCount++;
    if (this.sprites)
      this.sprites.forEach((sprite) => {
        // move UV coords
        let distFromCenter =
          MathUtil.getDistance(
            sprite.gridX,
            sprite.gridY,
            this.cols / 2,
            this.rows / 2
          ) * 3;
        let radsToCenter = MathUtil.getRadiansToTarget(
          sprite.gridX,
          sprite.gridY,
          this.cols / 2,
          this.rows / 2
        );
        let radialAmp =
          1 * Math.sin(this.frameCount * 0.03 + distFromCenter / 6);
        let xOsc = 20 * radialAmp * Math.cos(-radsToCenter);
        let yOsc = 20 * radialAmp * Math.sin(-radsToCenter);
        // let xOsc = 40 * Math.cos(distFromCenter + this.frameCount * 0.03);
        // let yOsc = 40 * Math.sin(distFromCenter + this.frameCount * 0.03);
        // let xOsc = 40 * Math.cos(sprite.gridX / 3 + this.frameCount * 0.03);
        // let yOsc = 40 * Math.sin(sprite.gridY / 3 + this.frameCount * 0.03);
        sprite.tilePosition.set(
          sprite.tilePositionOrig.x - xOsc,
          sprite.tilePositionOrig.y - yOsc
        );
        // adjust cell size
        // sprite.width = xOsc * 2;
      });
  }
}

if (window.autoInitDemo)
  window.demo = new PixiStageTexturedMeshDemo(document.body);
