class PixiTextureLoader {

  constructor(assetsLoadedCallback) {
    this.assetsLoadedCallback = assetsLoadedCallback;
    this.numTextures = 0;
    this.numLoaded = 0;
  }

  loadTexture(filePath, callback) {
    const texture = PIXI.Texture.fromImage(filePath);
    if(texture.width > 10) {
      texture.baseTexture.scaleMode = PIXI.SCALE_MODES.DEFAULT;
      callback(new PIXI.Sprite(texture));
    } else {
      this.numTextures++;
      texture.baseTexture.on('loaded', () => {
        texture.baseTexture.scaleMode = PIXI.SCALE_MODES.DEFAULT; // NEAREST;
        callback(new PIXI.Sprite(texture));
        this.numLoaded++
        if(this.numLoaded == this.numTextures) {
          if(this.assetsLoadedCallback) this.assetsLoadedCallback();
          this.assetsLoadedCallback = null;
        }
      });
    }
  }

  loadTextures(filePathsArr, callback) {
    let numLoaded = 0;
    const spritesArr = new Array(filePathsArr.length);
    for(let i=0; i < filePathsArr.length; i++) {
      (() => {
        const index = i;
        const file = filePathsArr[index];
        this.loadTexture(file, (sprite) => {
          spritesArr[index] = sprite;
          numLoaded++;
          if(numLoaded >= filePathsArr.length) callback(spritesArr);
        });
      })();
    }
  }

}
