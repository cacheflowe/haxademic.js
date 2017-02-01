"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EaseToValueCallback = function () {
  function EaseToValueCallback() {
    var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    var easeFactor = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;
    var callback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : EaseToValueCallback.noop;
    var finishRange = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0.01;

    _classCallCheck(this, EaseToValueCallback);

    this.easingFloat = new EasingFloat(value, easeFactor);
    this.callback = callback;
    this.finishRange = finishRange;
  }

  _createClass(EaseToValueCallback, [{
    key: "setTarget",
    value: function setTarget(value) {
      this.easingFloat.setTarget(value);
      this.easeToTarget();
    }
  }, {
    key: "easeToTarget",
    value: function easeToTarget() {
      var _this = this;

      this.callback(this.easingFloat.update());
      // keep easing if we're not close enough
      if (Math.abs(this.easingFloat.value() - this.easingFloat.target()) > this.finishRange) {
        requestAnimationFrame(function () {
          _this.easeToTarget();
        });
      } else {
        this.easingFloat.setValue(this.easingFloat.target());
        this.callback(this.easingFloat.value()); // call the callback one last time with the final value
      }
    }
  }]);

  return EaseToValueCallback;
}();

EaseToValueCallback.noop = function () {};
