import DemoBase from "./demo--base.js";
import KeyboardUtil from "../src/keyboard-util.js";

class KeyboardUtilDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "KeyboardUtil",
      "keyboard-util-container",
      "Press a key to reveal its key code, or press 'b' to see a special message."
    );
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
    KeyboardUtil.addSingleKeyListener("b", (e) => {
      this.debugEl.innerHTML = `B was pressed, and that's the one we were looking for!`;
    });
  }
}

if (window.autoInitDemo) window.demo = new KeyboardUtilDemo(document.body);
