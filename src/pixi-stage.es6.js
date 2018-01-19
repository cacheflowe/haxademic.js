class PixiStage {

  constructor(el, bgColor, id) {
    this.el = el;
    this.devicePixelRatio = window.devicePixelRatio;
    this.renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, {
      backgroundColor: bgColor,
      resolution: this.devicePixelRatio
    });
    this.renderer.view.classList.add(id);
    this.el.appendChild(this.renderer.view);
    this.stage = new PIXI.Container();
    this.stage.interactive = true;
    this.resize();
  }

  container() {
    return this.stage;
  }

  width() {
    return this.renderer.width / this.devicePixelRatio;
  }

  height() {
    return this.renderer.height / this.devicePixelRatio;
  }

  render() {
    this.renderer.render(this.stage);
  }

  resize() {
    this.renderer.resize(window.innerWidth, window.innerHeight);
  }

}
