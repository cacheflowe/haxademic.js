import DemoBase from "./demo--base.js";
import FrameLoop from "../src/frame-loop.js";
import MathUtil from "../src/math-util.js";
import PointerPos from "../src/pointer-pos.js";

class MathUtilDemo extends DemoBase {
  constructor(parentEl) {
    super(parentEl, [], "MathUtil", "math-util-container", "Math utilities");
  }

  init() {
    // animate loop
    window.frameLoop = new FrameLoop();
    window.frameLoop.addListener(this);
    // pointer position
    this.pointerPos = new PointerPos(() => {
      this.didMove = true;
    });
  }

  frameLoop(frameCount) {
    // update mouse speed when moving, otherwise ramp back down to zero
    let mouseMoveDist = this.didMove ? this.pointerPos.xDelta() : 0;
    this.didMove = false;

    // update debug output
    if (frameCount % 60 == 0) {
      this.el.innerHTML = `
        <div><code>scaleToTarget(5, 10): ${MathUtil.scaleToTarget(5, 10)}</code></div>
        <div><code>randRange(0, 10): ${MathUtil.randRange(0, 10)}</code></div>
        <div><code>randRangeDecimel(0, 10): ${MathUtil.randRangeDecimel(0, 10).toFixed(2)}</code></div>
        <div><code>randBoolean(): ${MathUtil.randBoolean()}</code></div>
        <div><code>randBooleanWeighted(0.8): ${MathUtil.randBooleanWeighted(0.8)}</code></div>
        <div><code>randIndexWeighted([3, 10, 30]): ${MathUtil.randIndexWeighted([3, 10, 30])}</code></div>
        <div><code>getPercentWithinRange(0, 100, 35): ${MathUtil.getPercentWithinRange(0, 100, 35)}</code></div>
      `;
    }
  }
}

if (window.autoInitDemo) window.demo = new MathUtilDemo(document.body);
