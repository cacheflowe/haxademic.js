import DemoBase from "./demo--base.es6.js";

class ScrollSnapDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "Scroll Snap | Vanilla",
      "scroll-snap-container",
      "Trying out the new-ish scroll-snap css"
    );
  }

  init() {
    this.injectCSS(`
      .scroll-snap-container {
        overflow: auto;
        display: flex;
        scroll-snap-type: x mandatory;
      }
      
      .box {
        height: 200px;
        width: 200px;
        background: red;
        margin-right: 5px;
        flex-shrink: 0;
        scroll-snap-align: start;
      }
      
      .dots {
        display: flex;
        justify-content: center;
      }
      
      .dot {
        all: unset;
        margin-right: 5px;
        height: 10px;
        width: 10px;
        border-radius: 10px;
        background: gray;
        margin-top: 10px;
        cursor: pointer;
      }
      
      .dot:focus {
        outline: 1px solid blue;
      }
    `);

    this.injectHTML(`
      <div>
        <div class="scroll-snap-container">
          <div class="box"></div>
          <div class="box"></div>
          <div class="box"></div>
          <div class="box"></div>
          <div class="box"></div>
          <div class="box"></div>  
          <div class="box"></div>
          <div class="box"></div>
          <div class="box"></div>
          <div class="box"></div>  
        </div>
        <div class="dots">
          <button class="dot"></button>
          <button class="dot"></button>
          <button class="dot"></button>
          <button class="dot"></button>
          <button class="dot"></button>
          <button class="dot"></button>
          <button class="dot"></button>
          <button class="dot"></button>
          <button class="dot"></button>
        </div>
      </div>
    `);

    // add pagination click listener
    const dots = document.querySelector(".dots");
    dots.addEventListener("click", (e) => {
      const target = e.target;
      if (!target.matches(".dot")) {
        return;
      }

      const index = Array.from(dots.children).indexOf(target);
      const selector = `.box:nth-child(${index + 1})`;
      const box = document.querySelector(selector);
      box.scrollIntoView({
        behavior: "smooth",
        inline: "start",
      });
    });
  }
}

if (window.autoInitDemo) window.demo = new ScrollSnapDemo(document.body);
