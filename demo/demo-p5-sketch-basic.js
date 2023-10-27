import DemoBase from "./demo--base.js";

class P5SketchBasicDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [
        "!../vendor/p5/p5.js", // load non-module code
        "../src/p5-sketch.js",
      ],
      "P5Sketch | Basic",
      "p5-container",
      "A basic p5js demo"
    );
  }

  init() {
    this.el.setAttribute("style", "height: 500px;");

    // init custom sketch subclass
    this.buildSubclass();
  }

  async buildSubclass() {
    // Dynamically import P5Sketch after loading non-module p5js.
    // Then create our custom sketch subclass
    let obj = await import("../src/p5-sketch.js");
    let P5Sketch = obj.default;

    // create custom p5 sketch subclass
    class CustomSketch extends P5Sketch {
      draw() {
        // draw background
        p.background(0);

        // draw shape
        p.fill(255);
        p.noStroke();
        p.translate(-p.width / 2, -p.height / 2, 1);
        p.circle(
          p.width / 2 + p.width * 0.25 * Math.sin(p.frameCount * 0.05),
          p.height / 2,
          100
        );
      }
    }

    // init custom sketch
    this.p5El = this.el; // document.getElementById("p5-sketch");
    this.p5Sketch = new CustomSketch(this.p5El);
  }
}

if (window.autoInitDemo) window.demo = new P5SketchBasicDemo(document.body);
