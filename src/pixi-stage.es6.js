class PixiStage {

  constructor(el, bgColor, id) {
    this.el = el;
    this.renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, {
      backgroundColor: bgColor,
      resolution: window.devicePixelRatio
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
    return this.renderer.width / window.devicePixelRatio;
  }

  height() {
    return this.renderer.height / window.devicePixelRatio;
  }

  render() {
    this.renderer.render(this.stage);
  }

  resize() {
    this.renderer.resize(window.innerWidth, window.innerHeight);
  }

  static scaleSpriteToFillContainer(sprite, width, height) {
    const ratioX = width / sprite.texture.width;
    const ratioY = height / sprite.texture.height;
    const scale = (ratioX > ratioY) ? ratioX : ratioY;
    sprite.scale.set(scale, scale);
    return scale;
  }
}
