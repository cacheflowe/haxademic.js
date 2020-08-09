class PixiStage {

  constructor(el=document.body, bgColor=0x000000, id='pixi', pixelRatio=(window.devicePixelRatio || 1)) {
    // store elements
    this.el = el;
    this.elSize = this.el.getBoundingClientRect();
    this.devicePixelRatio = pixelRatio;
    // PIXI.settings.PRECISION_FRAGMENT = 'highp'; // this makes text look better?

    // create app
    console.log(pixelRatio);
    this.app = new PIXI.Application({
        width: this.elSize.width,
        height: this.elSize.height,
        backgroundColor: bgColor,
        transparent: false,
        resizeTo: this.el,
        autoDensity: true,
        antialias: true,
        resolution: pixelRatio,
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
}
