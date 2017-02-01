'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PixiTextureLoader = function () {
  function PixiTextureLoader(assetsLoadedCallback) {
    _classCallCheck(this, PixiTextureLoader);

    this.assetsLoadedCallback = assetsLoadedCallback;
    this.numTextures = 0;
    this.numLoaded = 0;
  }

  _createClass(PixiTextureLoader, [{
    key: 'loadTexture',
    value: function loadTexture(filePath, callback) {
      var _this = this;

      var texture = PIXI.Texture.fromImage(filePath);
      if (texture.width > 10) {
        texture.baseTexture.scaleMode = PIXI.SCALE_MODES.DEFAULT;
        callback(new PIXI.Sprite(texture));
      } else {
        this.numTextures++;
        texture.baseTexture.on('loaded', function () {
          texture.baseTexture.scaleMode = PIXI.SCALE_MODES.DEFAULT; // NEAREST;
          callback(new PIXI.Sprite(texture));
          _this.numLoaded++;
          if (_this.numLoaded == _this.numTextures) {
            if (_this.assetsLoadedCallback) _this.assetsLoadedCallback();
            _this.assetsLoadedCallback = null;
          }
        });
      }
    }
  }, {
    key: 'loadTextures',
    value: function loadTextures(filePathsArr, callback) {
      var _this2 = this;

      var numLoaded = 0;
      var spritesArr = new Array(filePathsArr.length);

      var _loop = function _loop(i) {
        (function () {
          var index = i;
          var file = filePathsArr[index];
          _this2.loadTexture(file, function (sprite) {
            spritesArr[index] = sprite;
            numLoaded++;
            if (numLoaded >= filePathsArr.length) callback(spritesArr);
          });
        })();
      };

      for (var i = 0; i < filePathsArr.length; i++) {
        _loop(i);
      }
    }
  }]);

  return PixiTextureLoader;
}();
