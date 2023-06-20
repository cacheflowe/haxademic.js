import DemoBase from "./demo--base.es6.js";
import DomUtil from "../src/dom-util.es6.js";
import ImageUtil from "../src/image-util.es6.js";
import CanvasUtil from "../src/canvas-util.es6.js";

// synchronously load non-module p5js.
await DomUtil.injectScriptSync("../vendor/p5/p5.js");

// then import P5App in a way that uses the injected non-module library
// import P5App from '../src/p5-app.es6.js';
const P5App = (await import("../src/p5-app.es6.js")).default;

class DateUtilDemo extends DemoBase {
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
    await this.loadImageData();
  }

  async loadImageData() {
    this.debugEl.innerHTML += `<hr><p><b>Image Sampling stats:</b></p>`;

    // load image
    const img = await ImageUtil.loadImageSync("../data/images/bird-map.png");
    this.injectHTML(`<h3>Original image</h3>`);
    this.el.appendChild(img);
    this.injectHTML(`<hr>`);

    // copy to a canvas so we can access pixel data
    let ctx = CanvasUtil.imageToContext(img);

    // get pixel data
    let pixelData = CanvasUtil.getImageDataForContext(ctx);
    console.log(pixelData);

    // get map positions
    let positionsGrid = this.scanGrid(ctx, pixelData, 4);
    let positionsRandom = this.scanStochastic(ctx, pixelData, 800);

    // draw map points
    this.injectHTML(`<h3>Grid sampling</h3>`);
    this.drawPoints(CanvasUtil.cloneCanvas(ctx.canvas), positionsGrid);
    this.injectHTML(`<hr>`);
    this.injectHTML(`<h3>Stochastic sampling</h3>`);
    this.drawPoints(CanvasUtil.cloneCanvas(ctx.canvas), positionsRandom);

    // build sketch that uses data
    this.injectHTML(`<hr>`);
    this.injectHTML(`<h3>Samples as particles</h3>`);
    this.injectHTML(`<p>Mouse y-position will change data sets</p>`);
    let p5Container = this.buildContainer("p5-container");
    this.p5Sketch = new CustomSketch(
      p5Container,
      positionsGrid,
      positionsRandom
    );
  }

  scanGrid(ctx, pixelData, spacing = 4) {
    let normalizedPixelData = [];
    let w = ctx.canvas.width;
    let h = ctx.canvas.height;
    let numAttempts = 0;
    for (var y = 0; y <= h; y += spacing) {
      for (var x = 0; x <= w; x += spacing) {
        if (CanvasUtil.getPixelRedFromImageData(pixelData, w, x, y) > 10) {
          normalizedPixelData.push([x / w - 0.5, y / h - 0.5]); // collect normalized, centered pixels that are turned on
        }
        numAttempts++;
      }
    }
    this.debugEl.innerHTML += `<p>Collected <code>${normalizedPixelData.length}</code> pixels with a spacing of <code>${spacing}px</code> with <code>${numAttempts}</code> pixel samples</p>`;
    return normalizedPixelData;
  }

  scanStochastic(ctx, pixelData, maxSamples = 400) {
    let w = ctx.canvas.width;
    let h = ctx.canvas.height;
    let normalizedPixelData = [];
    let numChecks = maxSamples * 10;
    let numAttempts = 0;
    while (numAttempts < numChecks && normalizedPixelData.length < maxSamples) {
      let x = Math.floor(Math.random() * w);
      let y = Math.floor(Math.random() * h);
      let pixel = CanvasUtil.getPixelRedFromImageData(pixelData, w, x, y);
      if (pixel > 10) {
        // collect normalized, centered pixels that are turned on
        normalizedPixelData.push([x / w - 0.5, y / h - 0.5]);
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
    let cameraAmp = 0.3;
    this.rotateX(this.map(this.mouseY, 0, this.height, cameraAmp, -cameraAmp));
    this.rotateY(this.map(this.mouseX, 0, this.width, -cameraAmp, cameraAmp));
  }

  drawParticles() {
    let particleSize = 20;
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
      this.image(this.particleImg, 0, 0, particleSize, particleSize);
      this.pop();
    });
  }
}

if (window.autoInitDemo) window.demo = new DateUtilDemo(document.body);
