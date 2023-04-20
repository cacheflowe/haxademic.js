import DemoBase from "./demo--base.es6.js";
import EventLog from "../src/event-log.es6.js";
import FrameLoop from "../src/frame-loop.es6.js";
import MobileUtil from "../src/mobile-util.es6.js";
import ObjectPool from "../src/object-pool.es6.js";
import PointerPos from "../src/pointer-pos.es6.js";

class ObjectPoolParticlesDemo extends DemoBase {
  static demoCSS = `
    #particles {
      background: #444;
      height: 400px;
      overflow: hidden;
      position: relative;
    }
    #particles-log {
      position: absolute;
      left: 0;
      top: 0;
      font-size: 10px;
      pointer-events: none;
    }
    .particle {
      position: absolute;
      background-color: #0f0;
      width: 10px;
      height: 10px;
      border-radius: 5px;
      margin-left: -5px;
      margin-top: -5px;
    }
    `;

  constructor(parentEl) {
    super(
      parentEl,
      null,
      "ObjectPool | Particles",
      "particles-container",
      "Click & drag to launch html particles in the box below"
    );
  }

  init() {
    this.injectCSS(ObjectPoolParticlesDemo.demoCSS);

    // build container
    this.particlesEl = document.createElement("div");
    this.particlesEl.id = "particles";
    this.el.appendChild(this.particlesEl);

    MobileUtil.lockElement(this.particlesEl);
    MobileUtil.disableTextSelect(this.particlesEl, true);
    this.initPointerPos();
    this.initObjectPool();
    this.log = new EventLog(this.debugEl);
    window._frameLoop = new FrameLoop().addListener(this);
  }

  initPointerPos() {
    // init pointerPos with callbacks
    let callbackMove = this.onPointerMove.bind(this);
    let callbackStart = this.onPointerStart.bind(this);
    let callbackEnd = this.onPointerEnd.bind(this);
    this.pointerPos = new PointerPos(callbackMove, callbackStart, callbackEnd);
  }

  initObjectPool() {
    this.particlePool = new ObjectPool(Particle);
  }

  // callbacks

  launchParticles() {
    let x = this.pointerPos.x(this.particlesEl);
    let y = this.pointerPos.y(this.particlesEl);
    let speedX = this.pointerPos.xDelta(this.particlesEl) / 2;
    let speedY = this.pointerPos.yDelta(this.particlesEl) / 2;
    const numLaunches = 3;
    for (var i = 0; i < numLaunches; i++) {
      let newParticle = this.particlePool.getObject();
      newParticle.launch(this.particlesEl, x, y, speedX, speedY);
    }
  }

  onPointerMove() {
    // this.log.log('MOVE!');
  }

  onPointerStart() {
    // this.log.log('START!');
  }

  onPointerEnd() {
    // this.log.log('END!');
  }

  // animation updates

  frameLoop(frameCount) {
    if (this.pointerPos.isTouching()) this.launchParticles();
    this.particlePool.pool().forEach((particle) => {
      particle.update();
    });
  }
}

class Particle {
  constructor() {
    this.el = document.createElement("div");
    this.el.classList.add("particle");
  }

  isActive() {
    return this.active;
  }

  launch(container, x, y, speedX, speedY) {
    this.container = container;
    this.x = x;
    this.y = y;
    this.speedX = speedX * (1 + -1 + 1 * Math.random());
    this.speedY = speedY * (1 + -1 + 1 * Math.random());
    if (Math.random() > 0.8) {
      this.speedX = -1 + 2 * Math.random();
      this.speedY = -1 + 2 * Math.random();
    }
    this.scale = 0.8 + 0.4 * Math.random();
    this.active = true;
    this.attached = false;
    this.el.style.setProperty(
      "background-color",
      `rgba(${Math.round(20 + Math.random() * 70)}, ${Math.round(
        140 + Math.random() * 70
      )}, ${Math.round(170 + Math.random() * 85)}, 1)`
    );
  }

  update() {
    if (!this.active) return;
    if (!this.attached) this.container.appendChild(this.el);
    // draw
    this.el.style.setProperty(
      "transform",
      `translate3d(${this.x}px, ${this.y}px, 0px) scale(${this.scale})`
    );
    // update props
    this.x += this.speedX;
    this.y += this.speedY;
    this.scale -= 0.08;
    if (this.scale <= 0) {
      this.active = false;
      this.container.removeChild(this.el);
    }
  }
}

if (window.autoInitDemo)
  window.demo = new ObjectPoolParticlesDemo(document.body);
