import DemoBase from "./demo--base.es6.js";
import DOMUtil from "../src/dom-util.es6.js";

class ModelViewerDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      null,
      "ModelViewer",
      "model-viewer-container",
      "Click & drag to launch html particles in the box below"
    );
  }

  init() {
    // inject *module* js
    DOMUtil.loadJavascript(
      "https://ajax.googleapis.com/ajax/libs/model-viewer/3.1.1/model-viewer.min.js",
      () => {
        this.loadModels();
      },
      "module"
    );
  }

  loadModels() {
    this.injectCSS(`
      .container {
      }
      model-viewer {
        width: 100%;
        height: 500px;
        background-color: #333;
        margin-bottom: var(--pico-typography-spacing-vertical);
      }
    `);
    this.injectHTML(`
      <div>
        <p>
          <b>Info</b>:<br>
          - https://modelviewer.dev/<br>
          - https://cwervo.com/writing/quicklook-web/<br>
          - https://developer.apple.com/news/?id=01132020a<br>
        </p>
        <p>Here's a duck</p>
        <model-viewer loading="lazy" camera-controls auto-rotate shadow-intensity="0.5" shadow-softness="0.5" --progress-bar-color="rgba(0,0,0,0)" src="../data/models/duck-v1/duck.gltf" alt="A 3D model of a duck"></model-viewer>
        <p>And a fox</p>
        <model-viewer loading="lazy" camera-controls auto-rotate shadow-intensity="0.5" shadow-softness="0.5" --progress-bar-color="rgba(0,0,0,0)" src="../data/models/fox/Fox.gltf" alt="A 3D model of a fox"></model-viewer>
        <p>One more duck</p>
        <model-viewer loading="lazy" camera-controls auto-rotate shadow-intensity="0.5" shadow-softness="0.5" --progress-bar-color="rgba(0,0,0,0)" src="../data/models/duck/Duck.gltf" alt="A 3D model of a duck"></model-viewer>
      </div>
    `);
  }
}

if (window.autoInitDemo) window.demo = new ModelViewerDemo(document.body);
