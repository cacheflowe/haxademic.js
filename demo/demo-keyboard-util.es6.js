import DemoBase from './demo--base.es6.js';
import KeyboardUtil from '../src/keyboard-util.es6.js';

class KeyboardUtilDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [], 'KeyboardUtil', 'keyboard-util-container');
  }

  init() {
    KeyboardUtil.addKeyListener((e) => {
      this.debugEl.innerHTML = `
        <code>e.key</code>: <code>${e.key}</code><br>
        <code>e.keyCode</code>: <code>${e.keyCode}</code> (deprecated)<br>
        <code>e.code</code>: <code>${e.code}</code><br>
        <code>e.shiftKey</code>: <code>${e.shiftKey}</code><br>
      `;
    });
    KeyboardUtil.addSingleKeyListener('b', (e) => {
      this.debugEl.innerHTML = `B was pressed, and that's the one we were looking for!`;
    });
  }

}

if(window.autoInitDemo) window.demo = new KeyboardUtilDemo(document.body);
