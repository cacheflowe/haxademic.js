import DemoBase from './demo--base.es6.js';

class ModelViewerDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [
      // "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js",
      "!https://unpkg.com/@google/model-viewer/dist/model-viewer-legacy.js",
    ], `
      <div class="container">
        <style>
          .container {
            background-color: gray;
          }
          model-viewer {
            width: 100%;
            height: 500px;
            background-color: gray;
          }
        </style>
        <h1>ModelViewer</h1>
        <p>Here's a duck</p>
        <model-viewer loading="lazy" camera-controls auto-rotate shadow-intensity="0.5" shadow-softness="0.5" --progress-bar-color="rgba(0,0,0,0)" src="../data/duck.gltf" alt="A 3D model of a duck"></model-viewer>
        <p>
          <b>Info</b>:<br>
          - https://modelviewer.dev/<br>
          - https://cwervo.com/writing/quicklook-web/<br>
          - https://developer.apple.com/news/?id=01132020a<br>
        </p>
        <model-viewer loading="lazy" camera-controls auto-rotate shadow-intensity="0.5" shadow-softness="0.5" --progress-bar-color="rgba(0,0,0,0)" src="../data/duck.gltf" alt="A 3D model of a duck"></model-viewer>
        <p>One more duck</p>
        <model-viewer loading="lazy" camera-controls auto-rotate shadow-intensity="0.5" shadow-softness="0.5" --progress-bar-color="rgba(0,0,0,0)" src="../data/duck.gltf" alt="A 3D model of a duck"></model-viewer>
      </div>
    `);
  }

  init() {
  }

}

if(window.autoInitDemo) window.demo = new ModelViewerDemo(document.body);
