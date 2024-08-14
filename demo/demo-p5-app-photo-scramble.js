import DemoBase from "./demo--base.js";
import ImageUtil from "../src/image-util.js";
import MathUtil from "../src/math-util.js";
import ObjectUtil from "../src/object-util.js";
import DomUtil from "../src/dom-util.js";

// synchronously load non-module p5js.
await DomUtil.injectScriptSync("../vendor/p5/p5.js");

// then import P5App in a way that uses the injected non-module library
// import P5App from '../src/p5-app.js';
const P5App = (await import("../src/p5-app.js")).default;

// Normal demo, after the import fixes above
class P5AppPhotoScramble extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "P5App Demo | Photo Scramble",
      "p5app-demo",
      "A prototype"
    );
  }

  init() {
    // init custom sketch
    this.p5Sketch = new CustomSketch(this.el);
  }
}

// create custom p5 sketch subclass
class CustomSketch extends P5App {
  ///////////////////
  // INIT
  ///////////////////

  constructor(el) {
    // always should just pass the container element to P5App constructor
    super(el);
    // then store any custom props passed into our subclass constructor
    // this.userData = userData;
  }

  ///////////////////
  // p5js overrides
  ///////////////////

  preload() {
    this.img = this.loadImage("../data/images/bb.jpg");
    // this.img = this.loadImage(
    //   "https://raw.githubusercontent.com/cacheflowe/haxademic/master/data/haxademic/images/no-signal.png"
    // );

    // this.img = this.loadImage("../data/images/justin-debbie.jpg");
    // this.img = this.loadImage("../data/images/deepak.jpg");
    // this.img = this.loadImage("https://cacheflowe.com/images/bio2_crop.jpg");
  }

  setup() {
    // this.createCanvas(this.windowWidth, this.windowHeight); // , this.WEBGL
    let clientBounds = this.containerEl().getBoundingClientRect();
    this.createCanvas(clientBounds.width, clientBounds.width, this.WEBGL);
    // this.pixelDensity(2);
    this.animated = true;
    if (!this.animated) this.noLoop();

    this.capture = this.createCapture(this.VIDEO);
    this.capture.size(400, 300);
    this.capture.hide();
    this.webcamPG = this.createGraphics(clientBounds.width, clientBounds.width);
  }

  draw() {
    this.background(0);
    this.setupContext();

    // this.setShadow(2, "rgba(0,0,0,1)", 2, 4);
    // this.setShadow(0);
    // this.setBlurFilter(2);
    // this.setBlurFilter(0);

    this.updateWebcamPG();

    // console.log(this.frameCount % 60);
    this.configGrid();
    if (this.frameCount % 60 == 0 || this.frameCount == 1)
      this.rebuildIndices();
    this.updateLerpedIndices();
    this.drawGrid();
  }

  windowResized() {
    let clientBounds = this.containerEl().getBoundingClientRect();
    this.resizeCanvas(clientBounds.width, clientBounds.width);
    this.webcamPG.resizeCanvas(clientBounds.width, clientBounds.width);
  }

  ///////////////////
  // DRAW
  ///////////////////

  setupContext() {
    this.background(0);
    this.textureMode(this.NORMAL);
    this.noStroke();

    // this.noFill();
    // this.drawLinearGradientRect([
    //   { stop: 0, color: "#44f" },
    //   { stop: 1, color: "#000" },
    // ]);
    // center in WebGL mode
    this.translate(-this.width / 2, -this.height / 2);
  }

  updateWebcamPG() {
    let offsetAndSize = ImageUtil.getOffsetAndSizeToCrop(
      this.webcamPG.width,
      this.webcamPG.height,
      this.inputTex().width,
      this.inputTex().height,
      true
    );
    this.webcamPG.background(0);
    this.webcamPG.image(
      this.inputTex(),
      offsetAndSize[0],
      offsetAndSize[1],
      offsetAndSize[2],
      offsetAndSize[3]
    );
  }

  inputTex() {
    if (this.capture) return this.capture;
    return this.img;
  }

  configGrid() {
    this.cols = 8;
    this.rows = 8;
    this.cellW = this.floor(this.width / this.cols);
    this.cellH = this.floor(this.height / this.rows);
  }

  rebuildIndices() {
    // rebuild index array
    this.indices = [];
    for (let x = 0; x < this.cols; x++) {
      let curCol = [];
      for (let y = 0; y < this.rows; y++) {
        curCol.push({ x, y });
      }
      this.indices.push(curCol);
    }

    // build lerped version
    if (!this.lerpedIndices) {
      this.lerpedIndices = ObjectUtil.deepCopy(this.indices);
      this.origIndices = ObjectUtil.deepCopy(this.indices);
      // maybe replace x/y with EasingFloat/LinearFloat objects?
      // for (let x = 0; x < this.cols; x++) {
      //   for (let y = 0; y < this.rows; y++) {
      //     this.lerped
      //   }
      // }
    }

    // scramble indices
    // loop through padded cells so we don't go out of array range
    for (let x = 1; x < this.indices.length - 1; x++) {
      for (let y = 1; y < this.indices[x].length - 1; y++) {
        let distFromCenter =
          MathUtil.getDistance(x, y, (this.cols - 1) / 2, (this.rows - 1) / 2) /
          this.rows;
        distFromCenter = distFromCenter * 2; // normalize distance

        // if (Math.random() < 0.4) {
        if (Math.random() > distFromCenter * 0.7) {
          // pull down dist to get closer to edge
          let randDirX = MathUtil.randRange(-1, 1);
          let randDirY = MathUtil.randRange(-1, 1);
          let otherCellIndx = this.indices[x + randDirX][y + randDirY];
          let thisCellIndx = this.indices[x][y];
          // swap
          this.indices[x][y] = otherCellIndx;
          this.indices[x + randDirX][y + randDirY] = thisCellIndx;
        }
      }
    }
  }

  updateLerpedIndices() {
    let easeFactor = 4;
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        this.lerpedIndices[x][y].x = MathUtil.easeTo(
          this.lerpedIndices[x][y].x,
          this.indices[x][y].x,
          easeFactor
        );
        this.lerpedIndices[x][y].y = MathUtil.easeTo(
          this.lerpedIndices[x][y].y,
          this.indices[x][y].y,
          easeFactor
        );
      }
    }
  }

  drawGrid() {
    // if (this.frameCount == 10) console.log(this.indices);

    // draw grid of cells
    this.texture(this.webcamPG);
    this.beginShape(this.QUADS);

    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        // for (let x = 0; x < this.indices.length; x++) {
        //   for (let y = 0; y < this.indices[x].length; y++) {
        let srcX = this.lerpedIndices[x][y].x;
        let srcY = this.lerpedIndices[x][y].y;

        // copy image to screen
        /*
        this.copy(
          this.inputTex(),
          srcX * this.cellW,
          srcY * this.cellH,
          this.cellW,
          this.cellH,
          x * this.cellW,
          y * this.cellH,
          this.cellW,
          this.cellH
          );
          */

        // calculate position of cell & UV coords
        let curX = x * this.cellW;
        let curY = y * this.cellH;
        let nextX = (x + 1) * this.cellW;
        let nextY = (y + 1) * this.cellH;
        let curU = srcX / this.cols;
        let curV = srcY / this.rows;
        let nextU = (srcX + 1) / this.cols;
        let nextV = (srcY + 1) / this.rows;

        // check displacement amount - value is indexes away from original
        let origX = this.origIndices[x][y].x;
        let origY = this.origIndices[x][y].y;
        let dispX = origX - srcX;
        let dispY = origY - srcY;

        // add tinting based on displacement...
        // need another way to do this, because tinting only applies to the whole shape.
        // check new versions of p5js. also try drawing another layer on top with some sort of gradient as the texture?
        let r = 255;
        let g = this.map(this.round(this.abs(dispX)), 0, 2, 255, 0);
        let b = this.map(this.round(this.abs(dispY)), 0, 2, 255, 0);
        // this.tint(r, g, b);

        // draw cell w/mapped UV
        this.vertex(curX, curY, 0, curU, curV);
        this.vertex(nextX, curY, 0, nextU, curV);
        this.vertex(nextX, nextY, 0, nextU, nextV);
        this.vertex(curX, nextY, 0, curU, nextV);
      }
    }
    this.endShape();
  }
}

if (window.autoInitDemo) window.demo = new P5AppPhotoScramble(document.body);
