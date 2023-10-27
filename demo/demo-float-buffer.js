import DemoBase from "./demo--base.js";
import FloatBuffer from "../src/float-buffer.js";
import FrameLoop from "../src/frame-loop.js";
import PointerPos from "../src/pointer-pos.js";

class FloatBufferDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "FloatBuffer",
      "float-buffer-container",
      "Floatbuffer holds the last [x] values given to it, providing a temporal window into recent values. Move your mouse on the x-axis to see what it calculates."
    );
  }

  init() {
    // animate loop
    window.frameLoop = new FrameLoop();
    window.frameLoop.addListener(this);
    // pointer position
    this.pointerPos = new PointerPos(() => {
      this.didMove = true;
    });
    // float buffer
    this.motionDetectX = new FloatBuffer(60);
  }

  frameLoop(frameCount) {
    // update mouse speed when moving, otherwise ramp back down to zero
    let mouseMoveDist = this.didMove ? this.pointerPos.xDelta() : 0;
    this.motionDetectX.update(mouseMoveDist);
    this.didMove = false;

    // update debug output
    var direction = "Still";
    if (this.motionDetectX.average() > 0) direction = "Right";
    if (this.motionDetectX.average() < 0) direction = "Left";
    this.el.innerHTML = `
      <div><code>this.motionDetectX.average()</code> = ${Math.round(
        this.motionDetectX.average()
      )}</div>
      <div><code>this.motionDetectX.sum()</code> = ${this.motionDetectX.sum()}</div>
      <div><code>this.motionDetectX.sumPositive()</code> = ${this.motionDetectX.sumPositive()}</div>
      <div><code>this.motionDetectX.sumNegative()</code> = ${this.motionDetectX.sumNegative()}</div>
      <div><code>this.motionDetectX.sumAbs()</code> = ${this.motionDetectX.sumAbs()}</div>
      <div><code>this.motionDetectX.max()</code> = ${this.motionDetectX.max()}</div>
      <div><code>this.motionDetectX.maxAbs()</code> = ${this.motionDetectX.maxAbs()}</div>
      <div><code>this.motionDetectX.min()</code> = ${this.motionDetectX.min()}</div>
      <div><code>direction</code> = ${direction}</div>
      <div><code>this.motionDetectX.toString()</code> = <br>${this.motionDetectX.toString()}</div>
    `;
  }
}

if (window.autoInitDemo) window.demo = new FloatBufferDemo(document.body);
