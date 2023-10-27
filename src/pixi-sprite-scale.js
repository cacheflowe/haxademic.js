import * as PIXI from "../vendor/pixi/pixi.mjs";

class PixiSpriteScale {
  static scaleToFillContainer(sprite, width, height) {
    const ratioX = width / sprite.texture.baseTexture.width;
    const ratioY = height / sprite.texture.baseTexture.height;
    const scale = ratioX > ratioY ? ratioX : ratioY;
    sprite.scale.set(scale, scale);
    return scale;
  }

  static scaleToFillContainerMult(sprite, width, height, scaleMult) {
    const ratioX = width / sprite.texture.baseTexture.width;
    const ratioY = height / sprite.texture.baseTexture.height;
    let scale = ratioX > ratioY ? ratioX : ratioY;
    scale *= scaleMult;
    sprite.scale.set(scale, scale);
    return scale;
  }

  static scaleToLetterboxContainer(sprite, width, height) {
    const ratioX = width / sprite.texture.baseTexture.width;
    const ratioY = height / sprite.texture.baseTexture.height;
    const scale = ratioX < ratioY ? ratioX : ratioY;
    sprite.scale.set(scale, scale);
    return scale;
  }

  static scaleToHeight(sprite, height) {
    const scale = height / sprite.texture.baseTexture.height;
    sprite.scale.set(scale, scale);
    return scale;
  }

  static scaleToWidth(sprite, width) {
    const scale = width / sprite.texture.baseTexture.width;
    sprite.scale.set(scale, scale);
    return scale;
  }

  static setSizeTextureCropped(sprite, targetW, targetH) {
    // get scale to fill container, and scale the sprite
    // based on the original texture size
    let targetScale = PixiSpriteScale.scaleToFillContainer(
      sprite,
      targetW,
      targetH
    );

    // calculate centered crop
    // use baseTexture because texture w/h is updated as we change the frame
    let cropX = (sprite.texture.baseTexture.width - targetW / targetScale) / 2;
    let cropY = (sprite.texture.baseTexture.height - targetH / targetScale) / 2;
    let cropW = targetW / targetScale;
    let cropH = targetH / targetScale;

    // crop frame to fill sprite
    sprite.texture.frame = new PIXI.Rectangle(cropX, cropY, cropW, cropH);
  }
}

export default PixiSpriteScale;
