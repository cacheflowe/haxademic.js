import * as PIXI from "../vendor/pixi/pixi.mjs";

class PixiStage {
  // https://pixijs.download/dev/docs/PIXI.IRendererOptions.html
  // https://pixijs.download/dev/docs/PIXI.IApplicationOptions.html
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
      backgroundAlpha: 1,
      resizeTo: !sizeOverride ? this.el : null, // resize to container unless we're providing a hard-coded canvas size
      autoDensity: true,
      antialias: false,
      resolution: pixelRatio,
      preserveDrawingBuffer: true, // allows saving of canvas, but hurts perf
      powerPreference: "high-performance",
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

  stopTicker() {
    this.app.stop();
  }

  startTicker() {
    this.app.start();
  }

  application() {
    return this.app;
  }

  stage() {
    return this.app.stage;
  }

  canvas() {
    return this.app.view;
  }

  renderer() {
    return this.app.renderer;
  }

  container() {
    return this.rootContainer;
  }

  width() {
    return this.renderer().width / this.devicePixelRatio;
  }

  widthRenderer() {
    return this.renderer().width;
  }

  height() {
    return this.renderer().height / this.devicePixelRatio;
  }

  heightRenderer() {
    return this.renderer().height;
  }

  fps() {
    return this.app.ticker.FPS;
  }

  static newTestPatternGraphics(w, h) {
    const graphics = new PIXI.Graphics();

    // background color
    graphics.beginFill(0x000000);
    graphics.drawRect(0, 0, w, h);
    graphics.endFill();

    // checkers boxes on top
    // target cell size but round to have a perfect fit
    let rectSize = 17;
    let numCellsW = Math.round(w / rectSize);
    let numCellsH = Math.round(h / rectSize);
    let rectSizeW = w / numCellsW;
    let rectSizeH = h / numCellsH;
    for (var x = 0; x < numCellsW; x++) {
      for (var y = 0; y < numCellsH; y++) {
        if ((x % 2 == 1 && y % 2 == 1) || (x % 2 == 0 && y % 2 == 0)) {
          graphics.beginFill(0xffffff);
          graphics.drawRect(x * rectSizeW, y * rectSizeH, rectSizeW, rectSizeH);
          graphics.endFill();
        }
      }
    }
    return graphics;
  }

  static newTestPatternTexture(renderer, w, h) {
    return PixiStage.graphicsToTexture(
      renderer,
      PixiStage.newTestPatternGraphics(w, h)
    );
  }

  static graphicsToTexture(renderer, graphics) {
    return renderer.generateTexture(graphics);
  }

  static setTextureRepeat(texture, repeat = true) {
    // MIRRORED_REPEAT is another option
    texture.baseTexture.wrapMode = repeat
      ? PIXI.WRAP_MODES.REPEAT
      : PIXI.WRAP_MODES.CLAMP;
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
