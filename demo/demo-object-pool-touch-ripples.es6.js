class ObjectPoolTouchRipplesDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [
      "../src/mobile-util.es6.js",
      "../src/object-pool.es6.js",
      "../src/pointer-pos.es6.js",
    ], `
    <div class="container">
      <style>
        #particles {
          background: #eee;
          border: 1px solid #999;
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
          border-radius: 30px;
          display: inline-block;
          animation-iteration-count: 1;
          opacity: 0;
          pointer-events: none;
        }

        .animating {
          animation: sendPulse 0.5s ease-out;
        }

        @keyframes sendPulse {
          0% {transform: scale(0.1, 0.1); opacity: 0.0;}
          50% {opacity: 1.0;}
          100% {transform: scale(1.2, 1.2); opacity: 0.0;}
        }

      </style>
      <h1>ObjectPool | Touch Ripples</h1>
      <div id="particles"></div>
    </div>
    `);
  }

  init() {
    this.el = document.querySelector('.container');
    this.particlesEl = document.querySelector('#particles');
    MobileUtil.disableTextSelect(this.particlesEl, true);
    this.pointerPos = new PointerPos();
    this.particlePool = new ObjectPool(Particle);
    this.particlesEl.addEventListener('click', this.onClick.bind(this));
  }

  // callbacks

  onClick(e) {
    let x = this.pointerPos.x(this.particlesEl);
    let y = this.pointerPos.y(this.particlesEl);
    console.log(x, y);
    let newParticle = this.particlePool.getObject();
    newParticle.launch(this.particlesEl, x, y);
  }

}

class Particle {

  constructor() {
    this.el = document.createElement('div');
    this.el.classList.add('ripple');
  }

  isActive() {
    return this.active;
  }

  launch(container, x, y, speedX, speedY) {
    this.container = container;
    this.x = x;
    this.y = y;
    this.active = true;
    this.el.style.setProperty('border-color', `rgba(${Math.round(20 + Math.random() * 70)}, ${Math.round(140 + Math.random() * 70)}, ${Math.round(170 + Math.random() * 85)}, 1)`);
    this.el.style.setProperty('left', `${this.x}px`);
    this.el.style.setProperty('top', `${this.y}px`);
    this.container.appendChild(this.el);
    requestAnimationFrame(() => {
      this.el.classList.add('animating');
    });

    setTimeout(() => {
      this.active = false;
      this.container.removeChild(this.el);
      this.el.classList.remove('animating');
    }, 1000);
  }

}

if(window.autoInitDemo) window.demo = new ObjectPoolTouchRipplesDemo(document.body);
