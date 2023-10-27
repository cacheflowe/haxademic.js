import DemoBase from "./demo--base.js";
import FloatBuffer from "../src/float-buffer.js";
import WheelUtil from "../src/wheel-util.js";

class WheelUtilDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "WheelUtil",
      "wheel-util-container",
      `
      Wheel on the document to change background color. Wheel on the element to scale.
    `
    );
  }

  init() {
    this.listenOnDocument();
    this.listenOnElement();
    this.initMovement();
    this.animate();
  }

  listenOnDocument() {
    // track color
    this.bgCol = 127;
    document.body.style.setProperty("transition", `all 0.2s linear`);

    // listen on document, no override (via default args)
    // positive delta is up, negative is down
    WheelUtil.addWheelListener((deltaX, deltaY, e) => {
      this.deltaX = deltaX;
      this.deltaY = deltaY;
      this.bgCol += deltaY * 5;
      this.bgCol = Math.min(Math.max(0, this.bgCol), 255); // clamp 0-255
      document.body.style.setProperty(
        "background-color",
        `rgba(${this.bgCol}, ${this.bgCol}, ${this.bgCol}, 1)`
      );
      this.updateDebug();
      // update movement controls
      this.speedX.update(-this.deltaX);
      this.speedY.update(-this.deltaY);
      this.lastWheelTime = Date.now();
    });
  }

  listenOnElement() {
    // track scroll to scale
    this.scale = 1;

    // add specific element to scroll
    this.scrollBox = document.createElement("div");
    this.scrollBox.setAttribute(
      "style",
      "width: 200px; height: 200px; background-color: rgba(0, 127, 0, 1)"
    );
    this.scrollBox.innerText = "Wheel me";
    this.scrollBox.style.setProperty("transition", `all 0.2s linear`);
    this.el.appendChild(this.scrollBox);

    WheelUtil.addWheelListener(
      (deltaX, deltaY, e) => {
        this.scale += deltaY / 10;
        this.scale = Math.min(Math.max(0.5, this.scale), 1.5); // clamp 0.5-1.5
        this.updateDebug();
      },
      this.scrollBox,
      true
    );
  }

  updateDebug() {
    this.debugEl.innerHTML = `
    <pre>
      deltaX: ${this.deltaX}
      deltaY: ${this.deltaY}
      Document bgCol: ${this.bgCol.toFixed(2)}
      Div scale: ${this.scale.toFixed(2)}
      </pre>
    `;
  }

  initMovement() {
    this.speedX = new FloatBuffer(20);
    this.speedY = new FloatBuffer(20);
    this.lastWheelTime = Date.now();
    this.curX = 0;
    this.curY = 0;
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // update offset position
    this.curX += this.speedX.average();
    this.curY += this.speedY.average();
    this.scrollBox.style.setProperty(
      "transform",
      `translate3d(${this.curX}px, ${this.curY}px, 0px) scale(${this.scale})`
    );

    // settle back down after a slight delay from user interaction
    if (Date.now() > this.lastWheelTime + 100) {
      this.speedX.update(0);
      this.speedY.update(0);
    }
  }
}

if (window.autoInitDemo) window.demo = new WheelUtilDemo(document.body);
