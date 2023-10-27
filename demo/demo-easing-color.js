import DemoBase from "./demo--base.js";
import EasingColor from "../src/easing-color.js";
import FrameLoop from "../src/frame-loop.js";

class EasingColorDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "EasingColor",
      "easing-color-container",
      "A lerping color object with lots of hex/rgba/int getters & setters to use your color in the DOM and in WebGL"
    );
  }

  init() {
    // build colors
    this.colors = [
      // rgba options
      new EasingColor(255, 0, 255),
      new EasingColor(255, 0, 255, 255),
      new EasingColor(255, 0, 255, 255, 0.02),
      // hex options
      new EasingColor("#ff00ff"),
      new EasingColor("ff00ff", 0.02),
      new EasingColor("#ffff00ff"),
      new EasingColor("#ffff00ff", 0.02),
      new EasingColor(0xff00ff),
      new EasingColor(0xff00ff, 0.02),
      new EasingColor(0xffff00ff),
      new EasingColor(0x99ff00ff, 0.02),
    ];

    // animate
    window._frameLoop = new FrameLoop(180, 4);
    _frameLoop.addListener(this);
  }

  frameLoop(frameCount) {
    // display colors
    let html = "";
    this.colors.forEach((el, i) => {
      el.update(true);
      html += `
        <div style="background-color: ${el.getRgbaString()}"><code>color ${
        i + 1
      }</code> : 
          (${Math.round(el.getR())}, ${Math.round(el.getG())}, ${Math.round(
        el.getB()
      )}) : 
          (${el.getRNorm().toFixed(2)}, ${el.getGNorm().toFixed(2)}, ${el
        .getBNorm()
        .toFixed(2)}) : 
          ${el.getRgbHex()} : 
          ${el.getRgbaString()}
        </div>
      `;
    });
    this.el.innerHTML = html;

    // sometimes pick new values
    if (frameCount % 200 == 0) {
      this.colors.forEach((el, i) => {
        el.setTargetRgba(
          this.randomComponent(),
          this.randomComponent(),
          this.randomComponent(),
          126 + Math.random() * 127
        );
        if (i % 2 == 0) {
          el.setTargetHex(EasingColor.randomColorHex());
        }
        el.setEaseFactor(0.01 + 0.15 * Math.random());
      });
    }
    // sometime individual components
    if (frameCount % 200 == 50) {
      this.colors.forEach((el, i) => {
        el.setTargetR(this.randomComponent());
      });
    }
    if (frameCount % 200 == 150) {
      this.colors.forEach((el, i) => {
        el.setTargetG(this.randomComponent());
      });
    }
  }

  randomComponent() {
    return Math.floor(Math.random() * 254);
  }
}

if (window.autoInitDemo) window.demo = new EasingColorDemo(document.body);
