class PixiStage {

  constructor(el=document.body, bgColor=0x000000, id='pixi') {
    // store elements
    this.el = el;
    this.elSize = this.el.getBoundingClientRect();
    this.devicePixelRatio = window.devicePixelRatio || 1;
    // PIXI.settings.PRECISION_FRAGMENT = 'highp'; //this makes text looks better

    // create app
    this.app = new PIXI.Application({
        width: this.elSize.width,
        height: this.elSize.height,
        backgroundColor: bgColor,
        transparent: false,
        resizeTo: this.el,
        autoDensity: true,
        resolution: this.devicePixelRatio,
    });

    el.appendChild(this.app.view);
    this.rootContainer = new PIXI.Container();
    this.app.stage.addChild(this.rootContainer);
    // this.app.stage.interactive = true;
  }

  addFrameListener(fn) {
    this.app.ticker.add(fn);
  }

  stage() {
    return this.app.stage;
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

}
