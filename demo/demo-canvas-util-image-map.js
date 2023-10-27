import DemoBase from "./demo--base.js";
import DomUtil from "../src/dom-util.js";
import URLUtil from "../src/url-util.js";
import CanvasUtil from "../src/canvas-util.js";
import DragDropUtil from "../src/drag-drop-util.js";
import ImageUtil from "../src/image-util.js";
import MathUtil from "../src/math-util.js";

// synchronously load non-module p5js.
await DomUtil.injectScriptSync("../vendor/p5/p5.js");

// then import P5App in a way that uses the injected non-module library
// import P5App from '../src/p5-app.js';
const P5App = (await import("../src/p5-app.js")).default;

class CanvasUtilImageMapDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "CanvasUtil | Image map",
      "image-map-container",
      "Sample a black & white image as a map of points"
    );
  }

  async init() {
    this.setupDragDrop();
    this.addDropOverCSS();
    await this.loadImageData("../data/images/birb-color.png");
  }

  setupDragDrop() {
    DragDropUtil.dropFile(this.el, (fileResult) => {
      if (!!fileResult.match(/image/)) {
        this.loadImageData(fileResult); // fileResult is base64-encoded image
      }
    });
  }

  async loadImageData(imgFile) {
    this.debugEl.innerHTML = `<hr><p><b>Image Sampling stats:</b></p>`;
    this.el.innerHTML = "";
    let targetPointCount =
      URLUtil.getHashQueryParam("targetPointCount") || 1600;
    let distanceThresh = URLUtil.getHashQueryParam("distanceThresh") || 3.5;

    // load image
    // const img = await ImageUtil.loadImageSync("../data/images/bird-map.png");
    const img = await ImageUtil.loadImageSync(imgFile);
    // const img = await ImageUtil.loadImageSync("../data/images/maple-leaf.png");
    // const img = await ImageUtil.loadImageSync("../data/images/bauhaus.png");
    // const img = await ImageUtil.loadImageSync("../data/images/swoosh.png");
    this.injectHTML(`<h3>Original image</h3>`);
    this.el.appendChild(img);
    this.injectHTML(`<hr>`);

    // copy to a canvas so we can access pixel data
    let ctx = CanvasUtil.imageToContext(img);

    // get pixel data
    let pixelData = CanvasUtil.getImageDataForContext(ctx);
    console.log(pixelData);

    // get map positions
    let positionsGrid = this.sampleGrid(ctx, pixelData, 4);
    let positionsRandom = this.sampleStochastic(ctx, pixelData, 600);
    let positionsRandomDist = this.sampleStochasticDistanceCheck(
      ctx,
      pixelData,
      targetPointCount, // 1600 for complex shapes, 800 for simple (swoosh)
      distanceThresh
    );

    // draw map points
    this.injectHTML(`<h3>Grid sampling</h3>`);
    this.drawPoints(CanvasUtil.cloneCanvas(ctx.canvas), positionsGrid);
    let outputDataGrid = positionsGrid.map((el) => [
      parseFloat(el[0].toFixed(3)),
      parseFloat(el[1].toFixed(3)),
    ]);
    this.injectHTML(`<textarea>${JSON.stringify(outputDataGrid)}</textarea>`);
    this.injectHTML(`<hr>`);
    this.injectHTML(`<h3>Random sampling</h3>`);
    this.drawPoints(CanvasUtil.cloneCanvas(ctx.canvas), positionsRandom);
    this.injectHTML(`<h3>Random sampling w/distance check</h3>`);
    this.drawPoints(CanvasUtil.cloneCanvas(ctx.canvas), positionsRandomDist);
    let outputDataRandom = positionsRandomDist.map((el) => [
      parseFloat(el[0].toFixed(3)),
      parseFloat(el[1].toFixed(3)),
    ]);
    this.injectHTML(`<textarea>${JSON.stringify(outputDataRandom)}</textarea>`);

    // build sketch that uses data
    this.injectHTML(`<hr>`);
    this.injectHTML(`<h3>Samples as particles</h3>`);
    this.injectHTML(`<p>Mouse y-position will change data sets</p>`);

    // build or re-add p5 sketch node
    if (this.p5Container) {
      this.el.appendChild(this.p5Container);
      this.p5Sketch.setPoints(positionsGrid, outputDataRandom);
    } else {
      this.p5Container = this.buildContainer("p5-container");
      this.p5Sketch = new CustomSketch(
        this.p5Container,
        positionsGrid,
        positionsRandomDist
      );
    }
  }

  sampleGrid(ctx, pixelData, spacing = 4) {
    let normalizedPixelData = [];
    let w = ctx.canvas.width;
    let h = ctx.canvas.height;
    let numAttempts = 0;
    for (var y = 0; y <= h; y += spacing) {
      for (var x = 0; x <= w; x += spacing) {
        if (CanvasUtil.getPixelRedFromImageData(pixelData, w, x, y) > 0) {
          // if white pixel
          normalizedPixelData.push([
            x / w - 0.5,
            y / h - 0.5,
            CanvasUtil.getPixelFromImageData(pixelData, w, x, y),
          ]); // collect normalized, centered pixels that are turned on
        }
        numAttempts++;
      }
    }
    this.debugEl.innerHTML += `<p>Collected <code>${normalizedPixelData.length}</code> pixels with a spacing of <code>${spacing}px</code> with <code>${numAttempts}</code> pixel samples</p>`;
    return normalizedPixelData;
  }

  sampleStochastic(ctx, pixelData, maxSamples = 400) {
    let w = ctx.canvas.width;
    let h = ctx.canvas.height;
    let normalizedPixelData = [];
    let numChecks = maxSamples * 10;
    let numAttempts = 0;
    while (numAttempts < numChecks && normalizedPixelData.length < maxSamples) {
      let x = Math.floor(Math.random() * w);
      let y = Math.floor(Math.random() * h);
      let pixel = CanvasUtil.getPixelRedFromImageData(pixelData, w, x, y);
      if (pixel > 2) {
        // if white pixel
        normalizedPixelData.push([
          x / w - 0.5,
          y / h - 0.5,
          CanvasUtil.getPixelFromImageData(pixelData, w, x, y),
        ]); // collect normalized, centered pixels that are turned on
      }
      numAttempts++;
    }
    this.debugEl.innerHTML += `<p>Collected <code>${normalizedPixelData.length}</code> pixels with a random sampling after <code>${numAttempts}</code> attempts</p>`;
    return normalizedPixelData;
  }

  sampleStochasticDistanceCheck(
    ctx,
    pixelData,
    maxSamples = 400,
    distThresh = 5
  ) {
    let w = ctx.canvas.width;
    let h = ctx.canvas.height;
    let normalizedPixelData = [];
    let numChecks = maxSamples * 30; // more attempts needed for distance check
    let numAttempts = 0;
    while (numAttempts < numChecks && normalizedPixelData.length < maxSamples) {
      let x = Math.floor(Math.random() * w);
      let y = Math.floor(Math.random() * h);
      let pixel = CanvasUtil.getPixelRedFromImageData(pixelData, w, x, y);
      if (pixel > 2) {
        // if white pixel
        // check for distance from other points, within a threshold
        var minDist = Number.POSITIVE_INFINITY;
        normalizedPixelData.forEach((el, i) => {
          let xCheckGrid = el[0] * w + w * 0.5; // convert normalized to grid coords for distance check in pixels
          let yCheckGrid = el[1] * h + h * 0.5;
          let distCheck = MathUtil.getDistance(xCheckGrid, yCheckGrid, x, y);
          minDist = Math.min(distCheck, minDist);
        });
        if (minDist > distThresh) {
          // if the point is far enough away,
          // collect normalized, centered pixels that are turned on
          normalizedPixelData.push([
            x / w - 0.5,
            y / h - 0.5,
            CanvasUtil.getPixelFromImageData(pixelData, w, x, y),
          ]);
        }
      }
      numAttempts++;
    }
    this.debugEl.innerHTML += `<p>Collected <code>${normalizedPixelData.length}</code> pixels with a random sampling after <code>${numAttempts}</code> attempts</p>`;
    return normalizedPixelData;
  }

  drawPoints(ctx, positions) {
    let w = ctx.canvas.width;
    let h = ctx.canvas.height;
    let pxSize = 3;
    positions.forEach((pos) => {
      let x = w / 2 + pos[0] * w; // normalized coords from center, between -0.5 - 0.5
      let y = h / 2 + pos[1] * h;
      ctx.fillStyle = "#f00";
      ctx.fillRect(x - pxSize / 2, y - pxSize / 2, pxSize, pxSize);
    });
    this.el.appendChild(ctx.canvas);
  }
}

///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
// create custom p5 sketch subclass
///////////////////////////////////
class CustomSketch extends P5App {
  constructor(el, positionsGrid, positionsRandom) {
    // always should just pass the container element to P5App constructor
    super(el);
    // then store any custom props passed into our subclass constructor
    this.positionsGrid = positionsGrid;
    this.positionsRandom = positionsRandom;
  }

  ///////////////////
  // p5js overrides
  ///////////////////

  setPoints(positionsGrid, positionsRandom) {
    this.positionsGrid = positionsGrid;
    this.positionsRandom = positionsRandom;
  }

  preload() {
    this.particleImg = this.loadImage("../data/images/particle.png");
  }

  setup() {
    let clientBounds = this.containerEl().getBoundingClientRect();
    this.createCanvas(
      clientBounds.width * 0.7,
      clientBounds.width * 0.7,
      this.WEBGL
    );

    // set up for ADD blend w/3d particles
    this.blendMode(this.ADD);
    let gl = this._renderer.GL;
    gl.disable(gl.DEPTH_TEST);
  }

  draw() {
    this.setupContext();
    this.drawParticles();
    this.fill(255);
  }

  windowResized() {
    let clientBounds = this.containerEl().getBoundingClientRect();
    this.resizeCanvas(clientBounds.width, clientBounds.width);
  }

  ///////////////////
  // DRAW
  ///////////////////

  setupContext() {
    this.background(0);
    this.noFill();
    this.fill(255);
    this.rectMode(this.CENTER);
    this.imageMode(this.CENTER);
    // this.translate(this.width / 2, this.height / 2);

    // camera
    let cameraAmp = 0.6;
    this.camRotX = this.map(this.mouseY, 0, this.height, cameraAmp, -cameraAmp);
    this.camRotY = this.map(this.mouseX, 0, this.width, cameraAmp, -cameraAmp);
    this.rotateX(this.camRotX);
    this.rotateY(this.camRotY);
  }

  drawParticles() {
    let particleSize = this.height * 0.03;
    let curData =
      this.mouseY > this.height / 2 ? this.positionsGrid : this.positionsRandom;
    curData.forEach((pos, i) => {
      let w = this.width;
      let h = this.height;
      let x = pos[0] * w; // normalized coords from center, between -0.5 - 0.5
      let y = pos[1] * h;
      let z = 0;
      // x += this.noise(x, y, this.frameCount / 100) * 10;
      // y += this.noise(x, y, this.frameCount / 300) * 10;
      // let z = this.sin(i + this.frameCount / 50) * -20;
      this.push();
      this.translate(x, y, z);
      this.rotateX(-this.camRotX); // billboard particles
      this.rotateY(-this.camRotY);
      if (pos.length > 2) this.tint(pos[2][0], pos[2][1], pos[2][2]);
      this.image(this.particleImg, 0, 0, particleSize, particleSize);
      this.pop();
    });
  }
}

if (window.autoInitDemo)
  window.demo = new CanvasUtilImageMapDemo(document.body);
