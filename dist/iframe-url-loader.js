'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var IframeUrlLoader = function () {
  function IframeUrlLoader(url, callback) {
    _classCallCheck(this, IframeUrlLoader);

    this.callback = callback;
    this.iframeLoader = document.createElement('iframe');
    this.iframeLoader.setAttribute('style', 'display:block; width: 1px; height: 1px; pointer-events: none; opacity: 0; position: absolute; top: -10px; left: -10px');
    document.body.appendChild(this.iframeLoader);
    this.iframeLoader.src = url;
    this.checkForIframeReady();
  }

  _createClass(IframeUrlLoader, [{
    key: 'checkForIframeReady',
    value: function checkForIframeReady() {
      var _this = this;

      this.iframeLoader.contentDocument.addEventListener('DOMContentLoaded', function () {
        return _this.iframeLoaded();
      });
      this.iframeLoader.contentWindow.addEventListener('load', function () {
        return _this.iframeLoaded();
      });
      this.iframeLoader.addEventListener('load', function () {
        return _this.iframeLoaded();
      });
    }
  }, {
    key: 'iframeLoaded',
    value: function iframeLoaded() {
      var _this2 = this;

      this.callback();
      if (this.iframeLoader) {
        setTimeout(function () {
          document.body.removeChild(_this2.iframeLoader);
          _this2.iframeLoader = null;
        }, 2000);
      }
    }
  }], [{
    key: 'recacheUrlForFB',
    value: function recacheUrlForFB(url) {
      // use: let iFrameLoader = new IframeUrlLoader(IframeUrlLoader.recacheUrlForFB('https://cacheflowe.com'), () => {console.log('recached!'); });
      return 'https://graph.facebook.com/?scrape=true&id=' + window.encodeURIComponent(url);
      // return `https://www.facebook.com/sharer/sharer.php?u=${this.getShareUrl()}`; // use this if the page redirects
    }
  }]);

  return IframeUrlLoader;
}();
