"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Oscillations = function () {
  function Oscillations() {
    _classCallCheck(this, Oscillations);
  }

  _createClass(Oscillations, null, [{
    key: "osc1",


    // borrowed from: https://soulwire.co.uk/math-for-motion/

    value: function osc1(t) {
      return Math.pow(Math.sin(t), 3);
    }
  }, {
    key: "osc2",
    value: function osc2(t) {
      return Math.pow(Math.sin(t * Math.PI), 12);
    }
  }, {
    key: "osc3",
    value: function osc3(t) {
      return Math.sin(Math.tan(Math.cos(t) * 1.2));
    }
  }]);

  return Oscillations;
}();
