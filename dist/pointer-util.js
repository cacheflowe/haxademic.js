"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PointerUtil = function () {
  function PointerUtil() {
    _classCallCheck(this, PointerUtil);
  }

  _createClass(PointerUtil, null, [{
    key: "multipleClickHandler",


    // TODO: finish converting this !
    value: function multipleClickHandler() {
      // require quintuple-click
      var clickStream = [];
      var numClicks = 5;
      var timeWindow = 3000;
      cameraInput.addEventListener(window.tapEvent, function (e) {
        clickStream.push(Date.now());
        while (clickStream.length > numClicks) {
          clickStream.shift();
        }var recentClicks = clickStream.filter(function (clickTime) {
          return clickTime > Date.now() - timeWindow;
        });
        if (recentClicks.length < numClicks) e.preventDefault();else clickStream.splice(0);
      });
    }
  }, {
    key: "disableRightClick",
    value: function disableRightClick(el) {
      el.oncontextmenu = function (e) {
        return false;
      };
    }
  }]);

  return PointerUtil;
}();
