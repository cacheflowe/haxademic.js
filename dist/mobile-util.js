'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MobileUtil = function () {
  function MobileUtil() {
    _classCallCheck(this, MobileUtil);
  }

  _createClass(MobileUtil, null, [{
    key: 'enablePseudoStyles',


    // TOUCHSCREEN HELPERS

    value: function enablePseudoStyles() {
      document.addEventListener("touchstart", function () {}, false);
    }
  }, {
    key: 'lockTouchScreen',
    value: function lockTouchScreen(isLocked) {
      if (isLocked == false) {
        document.ontouchmove = null;
      } else {
        document.ontouchmove = function (event) {
          event.preventDefault();
        };
      }
    }
  }, {
    key: 'hideSoftKeyboard',
    value: function hideSoftKeyboard() {
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      var inputs = document.querySelectorAll('input');
      for (var i = 0; i < inputs.length; i++) {
        inputs[i].blur();
      }
    }
  }, {
    key: 'unlockWebAudioOnTouch',
    value: function unlockWebAudioOnTouch() {
      window.addEventListener('touchstart', MobileUtil.playEmptyWebAudioSound);
    }
  }, {
    key: 'playEmptyWebAudioSound',
    value: function playEmptyWebAudioSound() {
      var myContext = AudioContext != null ? new AudioContext() : new webkitAudioContext(); // create empty buffer and play it
      var buffer = myContext.createBuffer(1, 1, 44100);
      var source = myContext.createBufferSource();
      source.buffer = buffer;
      source.connect(myContext.destination); // connect to output (your speakers)
      source.start(); // play the file
      window.removeEventListener('touchstart', MobileUtil.playEmptyWebAudioSound); // clean up the event listener
    }

    // PLATFORM DETECTION

  }, {
    key: 'isMobileBrowser',
    value: function isMobileBrowser() {
      var userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.match(/android|iphone|ipad|ipod/i)) return true;
      return false;
    }
  }, {
    key: 'isIOS',
    value: function isIOS() {
      var userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.match(/iphone/i)) return true;
      if (userAgent.match(/ipad/i)) return true;
      if (userAgent.match(/ipod/i)) return true;
      if (userAgent.match(/crios/i)) return true;
      return false;
    }
  }, {
    key: 'isIPhone',
    value: function isIPhone() {
      var userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.match(/iphone/i)) return true;
      if (userAgent.match(/ipod/i)) return true;
      return false;
    }
  }, {
    key: 'isAndroid',
    value: function isAndroid() {
      var userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.match(/android/i)) return true;
      return false;
    }
  }, {
    key: 'isSafari',
    value: function isSafari() {
      var userAgent = navigator.userAgent.toLowerCase();
      var isChrome = userAgent.match(/chrome/i) ? true : false;
      var isSafari = userAgent.match(/safari/i) ? true : false;
      return isSafari == true && isChrome == false ? true : false;
    }

    // MOBILE HELPERS

  }, {
    key: 'alertErrors',
    value: function alertErrors() {
      // alert errors on mobile to help detect bugs
      if (!window.addEventListener) return;
      window.addEventListener('error', function (e) {
        var fileComponents = e.filename.split('/');
        var file = fileComponents[fileComponents.length - 1];
        var line = e.lineno;
        var message = e.message;
        alert('ERROR\n' + 'Line ' + line + ' in ' + file + '\n' + message);
      });
    }
  }, {
    key: 'openNewWindow',
    value: function openNewWindow(href) {
      // gets around native mobile popup blockers
      var link = document.createElement('a');
      link.setAttribute('href', href);
      link.setAttribute('target', '_blank');
      var clickevent = document.createEvent('Event');
      clickevent.initEvent('click', true, false);
      link.dispatchEvent(clickevent);
      return false;
    }
  }]);

  return MobileUtil;
}();
