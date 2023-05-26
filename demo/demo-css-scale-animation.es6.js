import DemoBase from "./demo--base.es6.js";

class DateUtilDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "CSS Scale Animation",
      "animation-container",
      "Testing css animations with delay offsets."
    );
  }

  init() {
    this.injectCSS(`
      #animation-container {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        column-gap: 10px;
        row-gap: 10px;
      }
      #animation-container > div {
        height: 200px;
        background-image: url("../data/images/bb.jpg");
        background-size: 100%;
        background-position: center;
        animation: scale 4s ease-in-out infinite alternate;
      }
      @keyframes scale {
        from {
          background-size: 110%;
        }
        to {
          background-size: 140%;
        }
      }
    `);
    this.el.innerHTML = `
      <div style="animation-delay: ${this.randomOffset()}s;"></div>
      <div style="animation-delay: ${this.randomOffset()}s;"></div>
      <div style="animation-delay: ${this.randomOffset()}s;"></div>
      <div style="animation-delay: ${this.randomOffset()}s;"></div>
    `;
  }

  randomOffset() {
    return Math.random() * 4;
  }
}

if (window.autoInitDemo) window.demo = new DateUtilDemo(document.body);
