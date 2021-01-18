import DemoBase from './demo--base.es6.js';

class ScrollVizDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [], 'Scroll', 'scroll-container');
  }

  init() {
    // add dynamic text
    let txt = "";
    for(let i=0; i < 2000; i++) {
      txt += '💀';
    }
    this.el.innerHTML = txt;
    this.el.style.setProperty('font-size', '50px');
  }

}

if(window.autoInitDemo) window.demo = new ScrollVizDemo(document.body);
