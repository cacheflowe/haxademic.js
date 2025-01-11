import DemoBase from "./demo--base.js";
import FrameLoop from "../src/frame-loop.js";
import PointerPos from "../src/pointer-pos.js";

class LocalStorageDemo extends DemoBase {
  constructor(parentEl) {
    super(parentEl, [], "LocalStorage", "localstorage-container", "");
  }

  init() {
    // animate loop
    window.frameLoop = new FrameLoop();
    window.frameLoop.addListener(this);
    // pointer position
    this.pointerPos = new PointerPos(() => {
      this.didMove = true;
    });
    // show saved values
    this.el.innerHTML = `
      <div><code>x(): ${window.localStorage.getItem("pointerX")}</code></div>
      <div><code>y(): ${window.localStorage.getItem("pointerY")}</code></div>`;
  }

  frameLoop(frameCount) {
    // update mouse speed when moving, otherwise ramp back down to zero
    let mouseMoveDist = this.didMove ? this.pointerPos.xDelta() : 0;
    this.didMove = false;

    // update debug output
    if (
      Math.abs(this.pointerPos.xDelta()) > 0 ||
      Math.abs(this.pointerPos.yDelta()) > 0
    ) {
      window.localStorage.setItem("pointerX", this.pointerPos.x());
      window.localStorage.setItem("pointerY", this.pointerPos.y());
      this.el.innerHTML = `
        <div><code>x(): ${this.pointerPos.x()}</code></div>
        <div><code>y(): ${this.pointerPos.y()}</code></div>`;
    }
  }
}

if (window.autoInitDemo) window.demo = new LocalStorageDemo(document.body);
