import DemoBase from "./demo--base.es6.js";
import MobileUtil from "../src/mobile-util.es6.js";
import ObjectPool from "../src/object-pool.es6.js";
import PointerPos from "../src/pointer-pos.es6.js";

class ObjectPoolTouchRipplesDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "ObjectPool | Touch Ripples",
      "object-pool-touch-ripples",
      "Click in the box below to launch a particle"
    );
  }

  addCSS() {
    super.injectCSS(`
      #object-pool-touch-ripples {
        background: #444;
        height: 400px;
        overflow: hidden;
        position: relative;
      }

      .ripple {
        position: absolute;
        left: 0;
        top: 0;
        height: 60px;
        width: 60px;
        margin-left: -30px;
        margin-top: -30px;
        border: 6px solid #ff0000;
        border-radius: 50%;
        display: inline-block;
        pointer-events: none;
        z-index: 100;
        /*
        transform: scale(0, 0);
        opacity: 1;
        */
      }
      
      @keyframes sendPulse {
        0% {
          transform: scale(0.1, 0.1);
          opacity: 0.0;
        }
        50% {
          opacity: 1.0;
        }
        100% {
          transform: scale(1.2, 1.2); 
          opacity: 0.0;
        }
      }

      @keyframes myAnim {
        0%,
        50%,
        100% {
          opacity: 1;
        }

        25%,
        75% {
          opacity: 0;
        }
      }

      .animating {
        /*
        animation-name: sendPulse;
        animation-duration: 0.5s;
        animation-iteration-count: 1;
        animation-iteration-count: infinite;
        */
        animation: myAnim 2s ease 0s infinite normal forwards;

      }
    `);
  }

  init() {
    this.addCSS();
    MobileUtil.disableTextSelect(this.el, true);
    this.pointerPos = new PointerPos();
    this.particlePool = new ObjectPool(RippleParticle);
    this.el.addEventListener("click", this.onClick.bind(this));
  }

  onClick(e) {
    let x = this.pointerPos.x(this.el);
    let y = this.pointerPos.y(this.el);
    let newParticle = this.particlePool.getObject();
    newParticle.launch(this.el, x, y);
  }
}

class RippleParticle {
  constructor() {
    this.el = document.createElement("div");
    this.el.classList.add("ripple");
  }

  isActive() {
    return this.active;
  }

  launch(container, x, y, speedX, speedY) {
    this.container = container;
    this.x = x;
    this.y = y;
    this.active = true;
    let colorR = Math.round(20 + Math.random() * 70);
    let colorG = Math.round(20 + Math.random() * 70);
    let colorB = Math.round(170 + Math.random() * 85);
    this.el.style.setProperty(
      "border-color",
      `rgba(${colorR}, ${colorG}, ${colorB}, 1)`
    );
    this.el.style.setProperty("left", `${this.x}px`);
    this.el.style.setProperty("top", `${this.y}px`);
    this.container.appendChild(this.el);
    requestAnimationFrame(() => {
      this.el.classList.add("animating");
    });

    setTimeout(() => {
      this.active = false;
      // this.container.removeChild(this.el);
      // this.el.classList.remove("animating");
    }, 1000);
  }
}

if (window.autoInitDemo)
  window.demo = new ObjectPoolTouchRipplesDemo(document.body);
