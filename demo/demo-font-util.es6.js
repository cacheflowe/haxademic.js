import DemoBase from './demo--base.es6.js';
import DOMUtil from '../src/dom-util.es6.js';
import FontUtil from '../src/font-util.es6.js';

class FontUtilDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [], 'FontUtil', 'font-util-container');
  }

  init() {
    // add font listener & print fonts info to console
    FontUtil.fontLoadListener("Roboto-Black", () => this.onFontsLoaded());
    FontUtil.printFontInfoOnLoad();

    // add css to page
    let cssStr = `<style>
        @font-face{
          font-family: Roboto-Black;
          src: url(../fonts/Roboto-Black.ttf) format("truetype");
          font-style: normal;
        }
        body {
          font-family: Roboto-Black;
        }
      </style>
    `.trim();
    document.body.appendChild(DOMUtil.stringToDomElement(cssStr));
  }

  onFontsLoaded() {
    this.debugEl.innerHTML = "Fonts loaded!"
  }

}

if(window.autoInitDemo) window.demo = new FontUtilDemo(document.body);
