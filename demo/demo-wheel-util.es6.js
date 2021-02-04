import DemoBase from './demo--base.es6.js';
import WheelUtil from '../src/wheel-util.es6.js';

class WheelUtilDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [], 'WheelUtil', 'wheel-util-container', `
      Wheel on the document to change background color. Wheel on the element to scale.
    `);
  }

  init() {
    this.listenOnDocument();
    this.listenOnElement();
  }

  listenOnDocument() {
    // track color
    this.bgCol = 127;
    document.body.style.setProperty('transition', `all 0.2s linear`);

    // listen on document, no override (via default args)
    // positive delta is up, negative is down
    WheelUtil.addWheelListener((deltaY, e) => {
      this.bgCol += deltaY * 5;
      this.bgCol = Math.min(Math.max(0, this.bgCol), 255);  // clamp 0-255
      document.body.style.setProperty('background-color', `rgba(${this.bgCol}, ${this.bgCol}, ${this.bgCol}, 1)`);
      this.updateDebug();
    });
  }

  listenOnElement() {
    // track scroll to scale
    this.scale = 1.;

    // add specific element to scroll
    this.scrollBox = document.createElement('div');
    this.scrollBox.setAttribute('style', 'width: 200px; height: 200px; background-color: rgba(0, 127, 0, 1)');
    this.scrollBox.innerText = 'Wheel me';
    this.scrollBox.style.setProperty('transition', `all 0.2s linear`);
    this.el.appendChild(this.scrollBox);

    WheelUtil.addWheelListener((deltaY, e) => {
      this.scale += deltaY / 10;
      this.scale = Math.min(Math.max(0.5, this.scale), 1.5);  // clamp 0.5-1.5
      this.scrollBox.style.setProperty('transform', `scale(${this.scale})`);
      this.updateDebug();
    }, this.scrollBox, true);
  }

  updateDebug() {
    this.debugEl.innerHTML = `
      <pre>
      Document bgCol: ${this.bgCol.toFixed(2)}
      Div scale: ${this.scale.toFixed(2)};
      </pre>
    `
  }
}

if(window.autoInitDemo) window.demo = new WheelUtilDemo(document.body);
