import * as PIXI from "../vendor/pixi/pixi.mjs";
import PixiSpriteScale from "./pixi-sprite-scale.mjs";
import VideoUtil from "./video-util.mjs";

export default class PixiVideoPlayer {
  static textureCache = {};
  static videoElCache = {};

  constructor(videoPath = "", loop = true, progressBar = true) {
    if (progressBar) this.buildProgressBar();
    this.loadVideo(videoPath);
  }

  loadVideo(videoPath) {
    // load video if we haven't before
    // cache it, and pull it out for use
    if (!PixiVideoPlayer.textureCache[videoPath]) {
      // load video & attach loaded listener to build sprite with good width/height
      let newVideoEl = VideoUtil.buildVideoEl(videoPath, true);
      let newVideoTexture = this.videoTextureFromVideo(newVideoEl);
      PixiVideoPlayer.videoElCache[videoPath] = newVideoEl;
      PixiVideoPlayer.textureCache[videoPath] = newVideoTexture;
      window.videoElCache = PixiVideoPlayer.videoElCache;
      this.buildSprite(videoPath);
    } else {
      this.buildSprite(videoPath);
    }
  }

  buildSprite(videoPath, fps = 60) {
    // grab texture and video element from cache, set on object for use elsewhere
    this.videoTexture = PixiVideoPlayer.textureCache[videoPath];
    this.videoTexture.baseTexture.resource.autoUpdate = true;
    this.videoEl = this.videoTexture.baseTexture.resource.source;

    // init video sprite, or reset the texture on existing sprite
    if (!this.videoSprite) {
      this.videoSprite = new PIXI.Sprite(this.videoTexture);
    } else {
      this.videoSprite.texture = this.videoTexture;
    }
  }

  sprite() {
    return this.videoSprite;
  }

  videoTextureFromVideo(videoEl, fps) {
    var texture = PIXI.Texture.from(videoEl);
    texture.baseTexture.resource.updateFPS = fps;
    texture.baseTexture.resource.autoUpdate = true;
    texture.baseTexture.resource.source.play(); // this is the video element
    return texture;
  }

  //////////////////////////
  // progress bar
  //////////////////////////

  buildProgressBar() {
    let barH = 2;
    this.progressBar = new PIXI.Graphics();
    this.progressBar.beginFill(0xffffff);
    this.progressBar.drawRect(0, App.height() - barH, App.widthContent(), barH);
    this.videoSprite.addChild(this.progressBar);
  }

  updateProgressBar(frameCount, send = false) {
    let percent = VideoUtil.curTimeNorm(this.videoEl);
    this.progressBar.scale.x = percent;
  }

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
    if (!this.videoEl) return;
    this.shutDownOtherVideos();

    // play!
    this.videoEl.currentTime = 0;
    this.videoEl.play();

    // enable autoUpdating on PIXI texture
    // key is filename - need to strip origin root
    let key = this.videoEl.src.replace(window.location.origin, "");
    this.startUpdatingVideo(key);
  }

  pause() {
    if (!this.videoEl) return;
    this.videoEl.pause();
  }

  //////////////////////////
  // set size & position
  //////////////////////////

  videoW() {
    return this.videoEl.videoWidth;
  }

  videoH() {
    return this.videoEl.videoHeight;
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
