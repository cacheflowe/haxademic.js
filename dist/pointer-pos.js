'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PointerPos = function () {
  function PointerPos() {
    var _this = this;

    _classCallCheck(this, PointerPos);

    this.curX = -1;
    this.curY = -1;
    this.lastX = -1;
    this.lastY = -1;

    // add mouse/touch listeners
    document.addEventListener('mousedown', function (e) {
      _this.pointerMoved(e.clientX, e.clientY);
    });
    document.addEventListener('mousemove', function (e) {
      _this.pointerMoved(e.clientX, e.clientY);
    });
    document.addEventListener('touchstart', function (e) {
      _this.pointerMoved(e.touches[0].clientX, e.touches[0].clientY);
    });
    document.addEventListener('touchmove', function (e) {
      _this.pointerMoved(e.touches[0].clientX, e.touches[0].clientY);
    });
  }

  _createClass(PointerPos, [{
    key: 'reset',
    value: function reset() {
      this.curX = -1;
      this.curY = -1;
      this.lastX = -1;
      this.lastY = -1;
    }
  }, {
    key: 'pointerMoved',
    value: function pointerMoved(x, y) {
      this.lastX = this.curX;
      this.lastY = this.curY;
      this.curX = x;
      this.curY = y;
    }
  }, {
    key: 'x',
    value: function x() {
      var el = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      if (el) {
        var offset = el.getBoundingClientRect();
        return this.curX - offset.left;
      }
      return this.curX;
    }
  }, {
    key: 'y',
    value: function y() {
      var el = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      if (el) {
        var offset = el.getBoundingClientRect();
        return this.curY - offset.top;
      }
      return this.curY;
    }
  }, {
    key: 'xPercent',
    value: function xPercent(el) {
      if (el != null) {
        var offset = el.getBoundingClientRect();
        var relativeX = this.curX - offset.left;
        return relativeX / offset.width;
      }
      return this.curX / window.innerWidth;
    }
  }, {
    key: 'yPercent',
    value: function yPercent(el) {
      if (el != null) {
        var offset = el.getBoundingClientRect();
        var relativeY = this.curY - offset.top;
        return relativeY / offset.height;
      }
      return this.curY / window.innerHeight;
    }
  }, {
    key: 'xDelta',
    value: function xDelta() {
      return this.lastX == -1 ? 0 : this.curX - this.lastX;
    }
  }, {
    key: 'yDelta',
    value: function yDelta() {
      return this.lastY == -1 ? 0 : this.curY - this.lastY;
    }
  }]);

  return PointerPos;
}();
