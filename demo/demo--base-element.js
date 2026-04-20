import DOMUtil from "../src/dom-util.js";
import MobileUtil from "../src/mobile-util.js";
import VideoRecorder from "../src/video-recorder.js";

/**
 * DemoBase — minimal HTMLElement base for demo web components.
 *
 * The shell (demo/index.html) handles routing, layout chrome (title, nav,
 * description), and element instantiation. This class only provides the
 * per-demo lifecycle hooks and shared helper methods.
 *
 * Subclass pattern:
 *
 *   import DemoBase from "./demo--base-element.js";
 *
 *   class MyDemo extends DemoBase {
 *     static meta = {
 *       title: "My Demo",
 *       category: "Graphics",
 *       description: "Optional description",
 *       fullscreen: false,
 *     };
 *
 *     init() {
 *       // this      → the component element (use as root container)
 *       // this.el   → alias for this
 *       // this.debugEl → <p id="demo-debug"> from the shell
 *     }
 *
 *     keyDown(key) {}
 *
 *     disconnectedCallback() {
 *       super.disconnectedCallback();
 *       // stop loops, cancel animation frames, etc.
 *     }
 *   }
 *
 *   customElements.define("my-demo", MyDemo);
 *   // No autoInitDemo line — the shell creates the element.
 */
class DemoBase extends HTMLElement {
  connectedCallback() {
    this.el = this;
    this.debugEl = document.getElementById("demo-debug");
    this._keyHandler = (e) => this.keyDown(e.key);
    window.addEventListener("keydown", this._keyHandler);
    const meta = this.constructor.meta || {};
    if (meta.fullscreen) {
      document.body.classList.add("fullscreen");
      MobileUtil.addFullscreenListener();
      MobileUtil.addFullscreenEl(this, true);
    }
    this.init();
  }

  disconnectedCallback() {
    if (this._keyHandler) window.removeEventListener("keydown", this._keyHandler);
  }

  // -------------------------
  // Lifecycle hooks (override)
  // -------------------------

  init() {}

  keyDown(key) {}

  // -------------------------
  // DOM helpers
  // -------------------------

  injectCSS(css) {
    DOMUtil.injectCSS(css);
  }

  loadRemoteCSS(url) {
    DOMUtil.loadCSS(url);
  }

  injectHTML(html) {
    const el = DOMUtil.stringToDomElement(html.trim());
    this.el.appendChild(el);
    return el;
  }

  buildContainer(id, border = true) {
    const container = document.createElement("div");
    if (id) container.id = id;
    if (border) container.className = "container-inner";
    this.el.appendChild(container);
    return container;
  }

  addDropOverCSS() {
    this.injectCSS(`.drop-over { outline: 10px dashed #009900; }`);
  }

  // -------------------------
  // Notyf helpers
  // -------------------------

  addNotyf() {
    DOMUtil.loadJavascript("https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.js");
    this.loadRemoteCSS("https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.css");
  }

  notyfSuccess(msg) {
    if (!window.Notyf) return console.error("Notyf not loaded!");
    if (!this.notyf) this.notyf = new Notyf({ duration: 5000 });
    this.notyf.success(msg);
  }

  notyfError(msg) {
    if (!window.Notyf) return console.error("Notyf not loaded!");
    if (!this.notyf) this.notyf = new Notyf({ duration: 5000 });
    this.notyf.error(msg);
  }

  // -------------------------
  // Recording helpers
  // -------------------------

  initRecording(el, loopFrames, startFrame, extraFrames = 1) {
    this.recordEl = el;
    this.videoRecorder = new VideoRecorder(this.recordEl, {
      fileType: "webm",
      audioKBPS: 320,
      videoMBPS: 20,
      callback: (aLink) => {
        aLink.setAttribute("class", "button");
        this.el.appendChild(aLink);
      },
    });
    this.loopFrames = loopFrames;
    this.startFrame = startFrame + loopFrames + 1;
    this.endFrame = startFrame + loopFrames * 2 + extraFrames;
    this.numFramesRecorded = 0;
  }

  renderVideo() {
    if (!this.videoRecorder) return;
    const frameCount = _frameLoop.count();
    if (this.videoRecorder.recording()) {
      this.numFramesRecorded++;
      this.videoRecorder.addFrame();
    }
    if (frameCount === this.endFrame) this.videoRecorder.finish();
    if (frameCount === this.startFrame - 1) this.videoRecorder.start();
  }
}

export default DemoBase;
