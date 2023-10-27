import DemoBase from "./demo--base.js";

class ScrollVizDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "Scroll",
      "scroll-container",
      "Nothing to see here, just a scroll demo"
    );
  }

  init() {
    // add dynamic text
    let txt = "";
    for (let i = 0; i < 2000; i++) {
      txt += "💀";
    }
    this.el.innerHTML = txt;
    this.el.style.setProperty("font-size", "50px");
  }
}

if (window.autoInitDemo) window.demo = new ScrollVizDemo(document.body);
