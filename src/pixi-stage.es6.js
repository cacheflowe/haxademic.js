import * as PIXI from "../vendor/pixi/pixi.mjs";

class PixiStage {
  constructor(
    el = document.body,
    bgColor = 0x000000,
    id = "pixi",
    pixelRatio = window.devicePixelRatio || 1,
    sizeOverride = null
  ) {
    // store elements
    this.el = el;
    this.elSize = !sizeOverride
      ? this.el.getBoundingClientRect()
      : { width: sizeOverride.width, height: sizeOverride.height };
    this.devicePixelRatio = pixelRatio;
    // PIXI.settings.PRECISION_FRAGMENT = 'highp'; // this makes text look better?

    // create app
    this.app = new PIXI.Application({
      width: this.elSize.width,
      height: this.elSize.height,
      backgroundColor: bgColor,
      backgroundAlpha: true,
      resizeTo: !sizeOverride ? this.el : null, // resize to container unless we're providing a hard-coded canvas size
      autoDensity: true,
      antialias: true,
      resolution: pixelRatio,
      preserveDrawingBuffer: true, // allows saving of canvas, but hurts perf
    });

    el.appendChild(this.app.view);
    this.rootContainer = new PIXI.Container();
    this.app.stage.addChild(this.rootContainer);
    // this.app.stage.interactive = true;
  }

  addFrameListener(fn) {
    this.app.ticker.add(fn);
  }

  removeFrameListener(fn) {
    this.app.ticker.remove(fn);
  }

  stage() {
    return this.app.stage;
  }

  canvas() {
    return this.app.view;
  }

  container() {
    return this.rootContainer;
  }

  width() {
    return this.app.renderer.width / this.devicePixelRatio;
  }

  widthRenderer() {
    return this.app.renderer.width;
  }

  height() {
    return this.app.renderer.height / this.devicePixelRatio;
  }

  heightRenderer() {
    return this.app.renderer.height;
  }

  fps() {
    return this.app.ticker.FPS;
  }

  graphicsToTexture(graphics) {
    return this.app.renderer.generateTexture(graphics);
  }

  saveImage() {
    // requires `preserveDrawingBuffer` set to true
    this.canvas().toBlob((b) => {
      var a = document.createElement("a");
      a.download = "pixi-canvas-export";
      a.href = URL.createObjectURL(b);
      a.click();
    }, "image/png");
  }
}

export default PixiStage;
