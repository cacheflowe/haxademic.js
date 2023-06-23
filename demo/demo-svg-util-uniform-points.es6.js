import * as THREE from "../vendor/three/three.module.js";
import DemoBase from "./demo--base.es6.js";
import DomUtil from "../src/dom-util.es6.js";
import SVGUtil from "../src/svg-util.es6.js";
import CanvasUtil from "../src/canvas-util.es6.js";
import MathUtil from "../src/math-util.es6.js";

// synchronously load non-module p5js.
// then import P5App in a way that uses the injected non-module library
// import P5App from '../src/p5-app.es6.js';
await DomUtil.injectScriptSync("../vendor/p5/p5.js");
const P5App = (await import("../src/p5-app.es6.js")).default;

class SvgPathParseDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "SVG | Path to Uniform Points",
      "path-parse-container",
      "Sample svg paths to uniform points"
    );
  }

  // https://codesandbox.io/s/young-cherry-9qvb6?file=/src/js/app.js:1054-1971
  // https://www.scottiesdesigns.com/downloads/chinese-dragon-svg-cricut-silhouette/

  async init() {
    await this.loadSvgData();
  }

  async loadSvgData() {
    // load svg and generate points
    let svg = await SVGUtil.loadSvgFile("../data/images/cacheflowe-logo.svg");
    var shapePoints = SVGUtil.svgToUniformPoints(svg, 5);
    let shapePointsNorm = SVGUtil.normalizeAndCenterPoints(shapePoints);

    // show debug
    this.injectHTML(`<h3>Original svg</h3>`);
    this.el.appendChild(svg);
    this.injectHTML(`<hr>`);

    // build sketch that uses data
    this.injectHTML(`<h3>SVG as particles</h3>`);
    let p5Container = this.buildContainer("p5-container");
    this.p5Sketch = new CustomSketch(p5Container, shapePointsNorm);
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
  constructor(el, points) {
    // always should just pass the container element to P5App constructor
    super(el);
    // then store any custom props passed into our subclass constructor
    this.points = points;
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
    let cameraAmp = 0.6;
    this.camRotX = this.map(this.mouseY, 0, this.height, cameraAmp, -cameraAmp);
    this.camRotY = this.map(this.mouseX, 0, this.width, -cameraAmp, cameraAmp);
    this.rotateX(this.camRotX);
    this.rotateY(this.camRotY);
  }

  drawParticles() {
    let particleSize = this.height * 0.03;
    this.points.forEach((pos, i) => {
      let w = this.width;
      let h = this.height;
      let x = pos[0] * w; // normalized coords from center, between -0.5 - 0.5
      let y = pos[1] * h;
      let z = 0;
      // x += this.noise(x, y, this.frameCount / 100) * 10;
      // y += this.noise(x, y, this.frameCount / 300) * 10;
      // let z = this.sin(i + this.frameCount / 50) * -20;
      x *= 0.8;
      y *= 0.8;
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

if (window.autoInitDemo) window.demo = new SvgPathParseDemo(document.body);
