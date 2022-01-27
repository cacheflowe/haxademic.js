import DemoBase from './demo--base.es6.js';

// synchronously load non-module p5js.
await DemoBase.injectScript('../vendor/p5/p5.js');

// then import P5App in a way that uses the injected non-module library
// import P5App from '../src/p5-app.es6.js';
const P5App = (await import('../src/p5-app.es6.js')).default;


// Normal demo, after the import fixes above
class P5AppBasicDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [], 'P5App Demo', 'p5app-demo', 'P5App allows you to treat a p5js sketch as a normal es6 class with a little magic under the hood');
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
  }
  
  setup() {
    // this.createCanvas(this.windowWidth, this.windowHeight); // , this.WEBGL
    let clientBounds = this.containerEl().getBoundingClientRect();
    this.createCanvas(clientBounds.width, clientBounds.width);
    this.background(0);
    this.chartSize = this.min(this.width, this.height);
    this.animated = true;
    if(!this.animated) this.noLoop();
  }
  
  draw() {
    this.setupContext();
    this.drawRings();
    this.setBlurFilter(2);
    this.drawHex();
    this.setBlurFilter(0);
  }

  windowResized() {
    let clientBounds = this.containerEl().getBoundingClientRect();
    this.resizeCanvas(clientBounds.width, clientBounds.width);
    this.chartSize = this.min(this.width, this.height);
  }
  
  ///////////////////
  // DRAW
  ///////////////////
  
  setupContext() {
    this.background(0);
    this.drawGradientBg();
    this.noFill();
    this.translate(this.width/2, this.height/2);
  }

  drawGradientBg() {
    var gradient = this.ctx().createLinearGradient(20,0,220,0);

    // Add three color stops
    gradient.addColorStop(0, 'green');
    gradient.addColorStop(.5, 'cyan');
    gradient.addColorStop(1, 'black');

    // Set the fill style and draw a rectangle
    this.ctx().fillStyle = gradient;
    this.ctx().fillRect(20, 20, 200, 100);
  }

  setBlurFilter(blurAmp=2) {
    if(blurAmp === 0) {
      this.ctx().filter = 'none';
    } else {
      this.ctx().filter = `blur(${blurAmp * this.pixelDensity()}px)`
    }
  }
  
  numRings() {
    return 7;
  }
  
  strokeWSm() {
    return this.chartSize * 0.001;
  }
  
  strokeWLg() {
    return this.chartSize * 0.002;
  }
  
  chartRadius() {
    return this.chartSize / 2;
  }
  
  drawRings() {
    let ringSpacing = this.chartSize / this.numRings();
    this.push();
    this.noFill();
    this.strokeWeight(this.strokeWSm());
    for(let i=1; i < this.numRings(); i++) {
      this.push();
      this.rotate(this.frameCount * 0.001 * i);
      let ringRadius = this.chartSize - ringSpacing * i;
      this.stroke(127);
      this.dashedCircle(ringRadius/2);  
      this.pop();
    }
    this.pop();
  }
  
  dashedCircle(radius) {
    let dashSpacing = this.chartSize * 0.02;                    // responsive spacing?
    let circumference = radius * this.TWO_PI;
    let numDashes = this.floor(circumference / dashSpacing);    // floor for perfectly-spaced dashes
    let segmentRads = this.TWO_PI / numDashes;
    for(let i=0; i < numDashes; i++) {
      let curRads = segmentRads * i;
      let dashEndRads = segmentRads * i + segmentRads * 0.25;
      this.line(
        this.cos(curRads) * radius, this.sin(curRads) * radius,
        this.cos(dashEndRads) * radius, this.sin(dashEndRads) * radius
      );
    }
  }
  
  drawHex() {
    // hex calculations
    this.vertices = 6;
    this.segmentRads = this.TWO_PI / this.vertices;
    this.startRads = this.segmentRads / 2;
    this.strokeW = this.strokeWLg();
    this.length = this.chartRadius() - (this.chartRadius() / this.numRings());
    this.ellipseSize = this.chartSize * 0.0175;
    // draw hex shapes
    this.push();
    this.fill(255);
    this.noStroke();
    this.drawLinesAndDots();
    this.pop();
  }
  
  drawLinesAndDots() {
    for(let i=0; i < this.vertices; i++) {
      this.push();
      this.rotate(this.startRads + i * this.segmentRads);
      // draw line
      this.rect(0, -this.strokeW/2, this.length, this.strokeW);
      this.pop();
    }
  }
}

if(window.autoInitDemo) window.demo = new P5AppBasicDemo(document.body);