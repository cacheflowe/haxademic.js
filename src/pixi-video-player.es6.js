import * as PIXI from "../vendor/pixi/pixi.mjs";
import PixiSpriteScale from "./pixi-sprite-scale.es6.js";
import VideoUtil from "./video-util.es6.js";

export default class PixiVideoPlayer {
  static textureCache = {};
  static videoElCache = {};

  constructor(videoPath = "", videoFps = 60, loop = true, progressBar = true) {
    this._fps = videoFps;
    this.loadVideo(videoPath);
  }

  loadVideo(videoPath) {
    // load video if we haven't before
    // cache it, and pull it out for use
    // if (!PixiVideoPlayer.textureCache[videoPath]) {
    // load video & attach loaded listener to build sprite with good width/height
    this.videoSrcEl = VideoUtil.buildVideoEl(videoPath, true);
    this.texture = this.videoTextureFromVideo(this.videoSrcEl, this._fps);
    PixiVideoPlayer.videoElCache[videoPath] = this.videoSrcEl;
    PixiVideoPlayer.textureCache[videoPath] = this.texture;
    this.videoSprite = new PIXI.Sprite(this.texture);

    // } else {
    //   this.buildSprite(videoPath);
    // }
  }

  videoTextureFromVideo(videoEl) {
    let texture = PIXI.Texture.from(videoEl);
    texture.baseTexture.resource.updateFPS = this._fps;
    texture.baseTexture.resource.autoUpdate = true;
    texture.baseTexture.resource.source.play(); // this is the video element

    return texture;
  }

  updateStream(stream) {
    let oldTexture = this.texture;

    // clean up old texture
    this.videoSrcEl.srcObject = null;
    if (oldTexture) {
      if (oldTexture.baseTexture?.resource)
        oldTexture.baseTexture.resource.autoUpdate = false;
      PIXI.Texture.removeFromCache(oldTexture);
      oldTexture.destroy(true);
    }
    this.videoSprite.texture = null;

    // make a new texture!
    this.videoSrcEl.srcObject = stream;
    this.texture = PIXI.Texture.from(this.videoSrcEl);
    this.texture.once("update", (texture) => {
      //   texture.baseTexture.resource.updateFPS = this._fps;
      //   texture.baseTexture.resource.autoUpdate = true;
      this.videoSprite.texture = texture;
      // TODO - TRUN OFF OLD RENDERTING UNTIL RELOADED!!
    });

    // this.videoSrcEl.play();
    // let texture = PIXI.Texture.from(this.videoSrcEl);
  }

  // buildSprite(videoPath, fps = 60) {
  //   // grab texture and video element from cache, set on object for use elsewhere
  //   // this.texture = PixiVideoPlayer.textureCache[videoPath];
  //   this.texture.baseTexture.resource.autoUpdate = true;
  //   this.videoSrcEl = this.texture.baseTexture.resource.source;

  //   // init video sprite
  //   this.videoSprite = new PIXI.Sprite(this.texture);
  //   console.log(this.videoSprite);
  // }

  sprite() {
    return this.videoSprite;
  }

  //////////////////////////
  // progress bar
  //////////////////////////

  /*
  buildProgressBar() {
    let barH = 2;
    this.progressBar = new PIXI.Graphics();
    this.progressBar.beginFill(0xffffff);
    this.progressBar.drawRect(0, 0, this.videoSprite.width, barH);
    this.videoSprite.addChild(this.progressBar);
  }

  updateProgressBar(frameCount, send = false) {
    let percent = VideoUtil.curTimeNorm(this.videoSrcEl);
    this.progressBar.scale.x = percent;
  }
  */

  //////////////////////////
  // show/hide video play/pause
  //////////////////////////

  shutDownOtherVideos() {
    // stop prior videos in cache - we only want one playing at a time.
    // some apps won't want this, but maybe a good practice to have as default
    // to avoid running into performance problems with multiple videos auto-updating
    Object.keys(PixiVideoPlayer.videoElCache).map((key) =>
      stopUpdatingVideo(key)
    );
  }

  stopUpdatingVideo(key) {
    // get video element & pause player
    let videoEl = PixiVideoPlayer.videoElCache[key];
    videoEl.pause();

    // if there's a texture, turn off auto-updating in PIXI
    let texture = PixiVideoPlayer.textureCache[key];
    texture.baseTexture.resource.autoUpdate = false;
    // texture.baseTexture.resource.updateFPS = 30; // should already be set!
  }

  startUpdatingVideo(key) {
    let texture = PixiVideoPlayer.textureCache[key];
    texture.baseTexture.resource.autoUpdate = true;
  }

  play() {
    if (!this.videoSrcEl) return;
    this.shutDownOtherVideos();

    // play!
    this.videoSrcEl.currentTime = 0;
    this.videoSrcEl.play();

    // enable autoUpdating on PIXI texture
    // key is filename - need to strip origin root
    let key = this.videoSrcEl.src.replace(window.location.origin, "");
    this.startUpdatingVideo(key);
  }

  pause() {
    if (!this.videoSrcEl) return;
    this.videoSrcEl.pause();
  }

  //////////////////////////
  // set size & position
  //////////////////////////

  videoW() {
    return this.videoSrcEl.videoWidth;
  }

  videoH() {
    return this.videoSrcEl.videoHeight;
  }

  videoEl() {
    return this.videoSrcEl;
  }

  setFullScreen() {
    if (
      this.videoSprite &&
      this.videoSprite.texture &&
      this.videoSprite.texture.width > 100
    ) {
      this.setVideoSize(App.width(), App.height());
      this.videoSprite.position.x = 0;
      this.videoSprite.position.y = 0;
    }
  }

  setFullVideo() {
    if (
      this.videoSprite &&
      this.videoSprite.texture &&
      this.videoSprite.texture.width > 100
    ) {
      this.setVideoSize(App.widthContent(), App.height());
      this.videoSprite.position.x = 0;
      this.videoSprite.position.y = 0;
    }
  }

  setVideoSizeNorm(w, h) {
    let targetW = App.width() * w;
    let targetH = App.height() * h;
    this.setVideoSize(this.videoSprite, targetW, targetH);
  }

  setVideoSize(w, h) {
    PixiSpriteScale.setSizeTextureCropped(this.videoSprite, w, h);
  }
}
