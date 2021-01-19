import DemoBase from './demo--base.es6.js';

class P5SketchBasicDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [
      "!../vendor/p5/p5.js",  // load non-module code
      '../src/p5-sketch.es6.js',
    ], `
      <div class="container">
        <h1>P5Sketch | Basic</h1>
        <div id="p5-sketch" style="height: 400px;"></div>
      </div>
    `);
  }

  init() {
    // init custom sketch subclass
    this.buildSubclass();
  }

  async buildSubclass() {
    // Dynamically import P5Sketch after loading non-module p5js.
    // Then create our custom sketch subclass
    let obj = await import('../src/p5-sketch.es6.js');
    let P5Sketch = obj.default;

    // create custom p5 sketch subclass
    class CustomSketch extends P5Sketch {
      draw() {
        // draw background
        p.background(0);

        // draw shape
        p.fill(255);
        p.noStroke();
        p.translate(-p.width/2, -p.height/2, 1);
        p.circle(p.width/2 + p.width * 0.25 * Math.sin(p.frameCount * 0.05), p.height/2, 100);
      }
    }

    // init custom sketch
    this.p5El = document.getElementById('p5-sketch');
    this.p5Sketch = new CustomSketch(this.p5El);
  }
}


if(window.autoInitDemo) window.demo = new P5SketchBasicDemo(document.body);
