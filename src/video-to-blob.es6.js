class VideoToBlob {

  constructor(videoURL, callback) {
    this.callback = callback;
    this.loadVideo(videoURL);
  }

  loadFile(url, fileLoadCallback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.send();
    xhr.onload = function() {
      if (xhr.status !== 200) {
        console.warn('VideoToBlob.loadFile() :: Unexpected status code ' + xhr.status + ' for ' + url);
      }
      fileLoadCallback(new Uint8Array(xhr.response));
    };
  }

  loadVideo(videoURL) {
    let videoType = (videoURL.match(/mp4/gi)) ? 'video/mp4' : 'video/webm';
    this.loadFile(videoURL, (uInt8Array) => {
      var blob = new Blob([uInt8Array], {
        type: videoType
      });

      let videoEl = document.createElement('video');
      videoEl.defaultMuted = true;
      videoEl.setAttribute('muted', "true");
      videoEl.setAttribute('preload', "auto");
      videoEl.setAttribute('playsinline', "true");
      videoEl.setAttribute('crossOrigin', "anonymous");
      videoEl.setAttribute('loop', "true");
      // videoEl.setAttribute('autoplay', "true");

      videoEl.src = URL.createObjectURL(blob);
      videoEl.setAttribute('muted', "true");
      videoEl.muted = true;
      videoEl.volume = 0;

      this.callback(videoEl);
    });
  }

  // buildVideoTexture() {
  //   var texture = PIXI.Texture.from(this.videoEl);
  //   texture.baseTexture.resource.updateFPS = 30;
  //   this.sprite = new PIXI.Sprite(texture);
  //   this.container.addChild(this.sprite);
  //   this.sprite.mask = this.maskGraphics;
  // }

}
