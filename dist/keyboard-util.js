'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var KeyboardUtil = function () {
  function KeyboardUtil() {
    _classCallCheck(this, KeyboardUtil);
  }

  _createClass(KeyboardUtil, null, [{
    key: 'addKeyListener',
    value: function addKeyListener(keycode, callback) {
      window.addEventListener('keydown', function (e) {
        var key = e.keyCode ? e.keyCode : e.which;
        // console.log(key);
        if (key == keycode) {
          callback(e);
        }
      });
    }
  }]);

  return KeyboardUtil;
}();
