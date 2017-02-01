"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// From: https://github.com/danro/jquery-easing/blob/master/jquery.easing.js
// t: current time, b: begInnIng value, c: change In value, d: duration
// Penner.easeInOutCirc(val, 0, 1, 1)
var Penner = function () {
  function Penner() {
    _classCallCheck(this, Penner);
  }

  _createClass(Penner, null, [{
    key: "easeInQuad",
    value: function easeInQuad(t, b, c, d) {
      return c * (t /= d) * t + b;
    }
  }, {
    key: "easeOutQuad",
    value: function easeOutQuad(t, b, c, d) {
      return -c * (t /= d) * (t - 2) + b;
    }
  }, {
    key: "easeInOutQuad",
    value: function easeInOutQuad(t, b, c, d) {
      if ((t /= d / 2) < 1) return c / 2 * t * t + b;
      return -c / 2 * (--t * (t - 2) - 1) + b;
    }
  }, {
    key: "easeInCubic",
    value: function easeInCubic(t, b, c, d) {
      return c * (t /= d) * t * t + b;
    }
  }, {
    key: "easeOutCubic",
    value: function easeOutCubic(t, b, c, d) {
      return c * ((t = t / d - 1) * t * t + 1) + b;
    }
  }, {
    key: "easeInOutCubic",
    value: function easeInOutCubic(t, b, c, d) {
      if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
      return c / 2 * ((t -= 2) * t * t + 2) + b;
    }
  }, {
    key: "easeInQuart",
    value: function easeInQuart(t, b, c, d) {
      return c * (t /= d) * t * t * t + b;
    }
  }, {
    key: "easeOutQuart",
    value: function easeOutQuart(t, b, c, d) {
      return -c * ((t = t / d - 1) * t * t * t - 1) + b;
    }
  }, {
    key: "easeInOutQuart",
    value: function easeInOutQuart(t, b, c, d) {
      if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
      return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
    }
  }, {
    key: "easeInQuint",
    value: function easeInQuint(t, b, c, d) {
      return c * (t /= d) * t * t * t * t + b;
    }
  }, {
    key: "easeOutQuint",
    value: function easeOutQuint(t, b, c, d) {
      return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
    }
  }, {
    key: "easeInOutQuint",
    value: function easeInOutQuint(t, b, c, d) {
      if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b;
      return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
    }
  }, {
    key: "easeInSine",
    value: function easeInSine(t, b, c, d) {
      return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
    }
  }, {
    key: "easeOutSine",
    value: function easeOutSine(t, b, c, d) {
      return c * Math.sin(t / d * (Math.PI / 2)) + b;
    }
  }, {
    key: "easeInOutSine",
    value: function easeInOutSine(t, b, c, d) {
      return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
    }
  }, {
    key: "easeInExpo",
    value: function easeInExpo(t, b, c, d) {
      return t == 0 ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
    }
  }, {
    key: "easeOutExpo",
    value: function easeOutExpo(t, b, c, d) {
      return t == d ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
    }
  }, {
    key: "easeInOutExpo",
    value: function easeInOutExpo(t, b, c, d) {
      if (t == 0) return b;
      if (t == d) return b + c;
      if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
      return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
    }
  }, {
    key: "easeInCirc",
    value: function easeInCirc(t, b, c, d) {
      return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
    }
  }, {
    key: "easeOutCirc",
    value: function easeOutCirc(t, b, c, d) {
      return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
    }
  }, {
    key: "easeInOutCirc",
    value: function easeInOutCirc(t, b, c, d) {
      if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
      return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
    }
  }, {
    key: "easeInElastic",
    value: function easeInElastic(t, b, c, d) {
      var s = 1.70158;var p = 0;var a = c;
      if (t == 0) return b;if ((t /= d) == 1) return b + c;if (!p) p = d * .3;
      if (a < Math.abs(c)) {
        a = c;var s = p / 4;
      } else var s = p / (2 * Math.PI) * Math.asin(c / a);
      return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
    }
  }, {
    key: "easeOutElastic",
    value: function easeOutElastic(t, b, c, d) {
      var s = 1.70158;var p = 0;var a = c;
      if (t == 0) return b;if ((t /= d) == 1) return b + c;if (!p) p = d * .3;
      if (a < Math.abs(c)) {
        a = c;var s = p / 4;
      } else var s = p / (2 * Math.PI) * Math.asin(c / a);
      return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
    }
  }, {
    key: "easeInOutElastic",
    value: function easeInOutElastic(t, b, c, d) {
      var s = 1.70158;var p = 0;var a = c;
      if (t == 0) return b;if ((t /= d / 2) == 2) return b + c;if (!p) p = d * (.3 * 1.5);
      if (a < Math.abs(c)) {
        a = c;var s = p / 4;
      } else var s = p / (2 * Math.PI) * Math.asin(c / a);
      if (t < 1) return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
      return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * .5 + c + b;
    }
  }, {
    key: "easeInBack",
    value: function easeInBack(t, b, c, d, s) {
      if (s == undefined) s = 1.70158;
      return c * (t /= d) * t * ((s + 1) * t - s) + b;
    }
  }, {
    key: "easeOutBack",
    value: function easeOutBack(t, b, c, d, s) {
      if (s == undefined) s = 1.70158;
      return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
    }
  }, {
    key: "easeInOutBack",
    value: function easeInOutBack(t, b, c, d, s) {
      if (s == undefined) s = 1.70158;
      if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= 1.525) + 1) * t - s)) + b;
      return c / 2 * ((t -= 2) * t * (((s *= 1.525) + 1) * t + s) + 2) + b;
    }
  }, {
    key: "easeOutBounce",
    value: function easeOutBounce(t, b, c, d) {
      if ((t /= d) < 1 / 2.75) {
        return c * (7.5625 * t * t) + b;
      } else if (t < 2 / 2.75) {
        return c * (7.5625 * (t -= 1.5 / 2.75) * t + .75) + b;
      } else if (t < 2.5 / 2.75) {
        return c * (7.5625 * (t -= 2.25 / 2.75) * t + .9375) + b;
      } else {
        return c * (7.5625 * (t -= 2.625 / 2.75) * t + .984375) + b;
      }
    }
  }]);

  return Penner;
}();
