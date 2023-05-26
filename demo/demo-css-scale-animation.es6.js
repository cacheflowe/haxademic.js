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
        grid-template-columns: repeat(3, 1fr);
        column-gap: 10px;
        row-gap: 10px;
      }
      #animation-container > div {
        height: 200px;
        background-image: url("../data/images/bb.jpg");
        background-size: 100%;
        background-position: center;
        animation: scale 6s ease-in-out infinite alternate;
      }
      @keyframes scale {
        from {
          background-size: 110%;
        }
        to {
          background-size: 120%;
        }
      }
    `);
    this.el.innerHTML = new Array(16)
      .fill(0)
      .map(() => {
        return `<div style="animation-delay: ${this.randomOffset()}s;"></div>`;
      })
      .join("");
  }

  randomOffset() {
    return Math.random() * 6;
  }
}

if (window.autoInitDemo) window.demo = new DateUtilDemo(document.body);
