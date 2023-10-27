import DemoBase from "./demo--base.js";
import FrameLoop from "../src/frame-loop.js";
import GestureTracker from "../src/gesture-tracker.js";
import PointerPos from "../src/pointer-pos.js";

class GestureTrackerDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "GestureTracker",
      "gesture-detect-container",
      "Time-windowed gesture detection demo"
    );
  }

  init() {
    // animate loop
    window.frameLoop = new FrameLoop();
    window.frameLoop.addListener(this);

    // pointer position
    this.pointerPos = new PointerPos(() => (this.didMove = true));
    // gesture detect!
    this.GestureTrackerX = new GestureTracker(45, 40, [300, 1000]);
    this.GestureTrackerY = new GestureTracker(45, 40, 300);
  }

  frameLoop(frameCount) {
    // update mouse speed when moving, otherwise ramp back down to zero
    this.GestureTrackerX.update(this.didMove ? this.pointerPos.xDelta() : 0);
    this.GestureTrackerY.update(this.didMove ? this.pointerPos.yDelta() : 0);
    this.didMove = false;

    // update debug output
    this.el.innerHTML = `
      <hr>
      ${this.GestureTrackerX.toHtmlString()}
      <hr>
      ${this.GestureTrackerY.toHtmlString()}
      <hr>
    `;
  }
}

if (window.autoInitDemo) window.demo = new GestureTrackerDemo(document.body);
