import DOMUtil from "../src/dom-util.es6.js";
import ErrorUtil from "../src/error-util.es6.js";
import KeyboardUtil from "../src/keyboard-util.es6.js";
import MobileUtil from "../src/mobile-util.es6.js";
import VideoRecorder from "../src/video-recorder.es6.js";

class DemoBase {
  static loadDemo(demoJsFile = null) {
    // demos should auto-init to append to <body>
    window.autoInitDemo = true;

    // get demo name & turn into javascript include
    let demo = DemoBase.getDemoId();
    if (!demoJsFile) demoJsFile = DemoBase.demoJsFile();
    if (demoJsFile && demo.length > 1) {
      console.log("Loading demo: ", demoJsFile);
      ErrorUtil.initErrorCatching();
      DOMUtil.loadJavascript(demoJsFile, null, "module");
    } else {
      document.location.href = "../";
    }
  }

  static getDemoId() {
    let id =
      document.location.hash.indexOf("&") == -1
        ? document.location.hash
        : document.location.hash.split("&")[0];
    return id.substring(1);
  }

  static demoJsFile() {
    return `./demo-${DemoBase.getDemoId()}.es6.js?v=${Math.round(
      Math.random() * 9999999
    )}`;
  }

  constructor(
    parentEl,
    jsFiles,
    layoutHtmlOrTitle = null,
    elId = null,
    desc = null,
    fullscreen = false
  ) {
    this.parentEl = parentEl;
    if (layoutHtmlOrTitle != null && elId == null) {
      this.buildLayout(layoutHtmlOrTitle);
    } else if (elId != null) {
      let title = layoutHtmlOrTitle;
      this.buildLayoutBasic(elId, title, desc);
      this.el = document.getElementById(elId);
      if (fullscreen) {
        this.el.classList.add("fullscreen-bg");
        document.body.classList.add("fullscreen");
        MobileUtil.addFullscreenListener();
        MobileUtil.addFullscreenEl(this.el, true);
      }
      this.debugEl = document.getElementById("debug");
    }
    this.loadJsDependenciesSerial(jsFiles);
    this.addBackLink();
    window.addEventListener("keydown", (e) => this.keyDown(e.key));
  }

  addBackLink() {
    // add back button
    let btn = document.createElement("a");
    btn.innerText = "← All Demos";
    btn.setAttribute("href", "../");
    btn.setAttribute("role", "button");

    // add src link
    let srcBtn = document.createElement("a");
    let sourceBase = `https://github.com/cacheflowe/haxademic.js/blob/master/demo/demo-`;
    let sourceLink = `${sourceBase}${DemoBase.getDemoId()}.es6.js`;
    // let sourceLink = DemoBase.demoJsFile(); - points to local source:// file, but GitHub is nicer
    srcBtn.innerText = "Demo source";
    srcBtn.setAttribute("href", sourceLink);
    srcBtn.setAttribute("target", "_blank");
    srcBtn.setAttribute("style", "float: right");
    srcBtn.setAttribute("role", "button");

    // add to DOM
    let container = document.querySelector(".container");
    if (!!container) {
      container.prepend(btn);
      container.prepend(srcBtn);
    }
  }

  loadJsDependenciesSerial(jsFiles) {
    if (jsFiles == null || jsFiles.length == 0) return this.init();
    this.jsFiles = jsFiles;
    this.loadNextScript();
  }

  loadNextScript() {
    if (this.jsFiles.length > 0) {
      // load from front of array
      let nextJsFile = this.jsFiles.shift();
      // check for exclamation point to indicate non-module js dependency
      var moduleStatus = "module";
      if (nextJsFile.indexOf("!") == 0) {
        nextJsFile = nextJsFile.substring(1);
        moduleStatus = null;
      }
      console.log("Loading global js:", nextJsFile);
      // cache-bust
      nextJsFile += `?v=${Math.round(Math.random() * 9999999)}`;
      // load into <head>
      DOMUtil.loadJavascript(
        nextJsFile,
        () => this.loadNextScript(),
        moduleStatus
      );
    } else {
      this.init();
    }
  }

  buildLayout(html) {
    let layoutNode = DOMUtil.stringToDomElement(html.trim());
    this.parentEl.appendChild(layoutNode);
  }

  buildLayoutBasic(elId, title, desc) {
    document.title += ` | ${title}`;
    let descTag = !!desc ? `<p>${desc}</p>` : "";
    this.buildLayout(`
      <main class="container demo">
        <h1>${title}</h1>
        ${descTag}
        <div id="${elId}"></div>
        <p id="debug"></p>
      </main>
    `);
  }

  init() {
    // please override
  }

  keyDown(key) {
    // override
  }

  // modifiers for different demos

  addDropOverCSS() {
    this.injectCSS(`
      .drop-over {
        outline: 10px dashed #009900;
      }
    `);
  }

  addNotyf() {
    DOMUtil.loadJavascript("https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.js");
    this.loadRemoteCSS("https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.css");
    window._notyfSuccess = (args) => this.notyfSuccess(args);
    window._notyfError = (args) => this.notyfError(args);
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

  injectCSS(css) {
    DOMUtil.injectCSS(css);
  }

  loadRemoteCSS(cssFile) {
    DOMUtil.loadCSS(cssFile);
  }

  injectHTML(html) {
    this.el.appendChild(DOMUtil.stringToDomElement(html.trim()));
  }

  buildContainer(id) {
    id = !!id ? id : "container_" + Math.floor(Math.random() * 999999999);
    let container = document.createElement("div");
    container.setAttribute("id", id);
    container.setAttribute("class", "container-inner");
    this.el.appendChild(container);
    return container;
  }

  /////////////////////////////
  // RECORD
  /////////////////////////////

  initRecording(el, loopFrames, startFrame, extraFrames = 1) {
    this.recordEl = el;
    const optionsOverride = {
      fileType: "webm",
      audioKBPS: 320,
      videoMBPS: 20,
      callback: (aLink) => {
        aLink.setAttribute("class", "button");
        this.el.appendChild(aLink);
      },
    };
    this.videoRecorder = new VideoRecorder(this.recordEl, optionsOverride);

    // frame recording config
    this.loopFrames = loopFrames;
    this.startFrame = startFrame + loopFrames + 1;
    this.endFrame = startFrame + loopFrames * 2 + extraFrames;
    this.numFramesRecorded = 0;
  }

  renderVideo() {
    if (!this.videoRecorder) return;
    let frameCount = _frameLoop.count();
    if (this.videoRecorder.recording()) {
      this.numFramesRecorded++;
      this.videoRecorder.addFrame(); // record frames!
    }
    if (_frameLoop.count() == this.endFrame) {
      this.videoRecorder.finish();
      console.log("VideoRecorder :: finish frame ::", frameCount);
      console.log(
        "VideoRecorder :: total frames recorded:: ",
        this.numFramesRecorded
      );
    }
    if (frameCount == this.startFrame - 1) {
      this.videoRecorder.start();
      console.log("VideoRecorder :: start frame :: ", frameCount);
    }
  }
}

export default DemoBase;
