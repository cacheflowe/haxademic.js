"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// A wrapper for LinearFloat that allows us to consistently move towards a new target in the same amount of linear steps.
// Possibly useful.

var LinearFloatTo = function () {
  function LinearFloatTo() {
    var val = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    var step = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0.025;

    _classCallCheck(this, LinearFloatTo);

    this.startVal = val;
    this.endVal = val;
    this.progress = new LinearFloat(0, step);
  }

  _createClass(LinearFloatTo, [{
    key: "update",
    value: function update() {
      this.progress.update();
    }
  }, {
    key: "value",
    value: function value() {
      return this.map(this.progress.value(), 0, 1, this.startVal, this.endVal);
    }
  }, {
    key: "valuePenner",
    value: function valuePenner(equation) {
      return this.map(this.progress.valuePenner(equation), 0, 1, this.startVal, this.endVal);
    }
  }, {
    key: "setTarget",
    value: function setTarget(val) {
      if (val == this.endVal) return;
      this.startVal = this.value();
      this.endVal = val;
      this.progress.setValue(0);
      this.progress.setTarget(1);
    }
  }, {
    key: "map",
    value: function map(val, inputMin, inputMax, outputMin, outputMax) {
      return (outputMax - outputMin) * ((val - inputMin) / (inputMax - inputMin)) + outputMin;
    }
  }]);

  return LinearFloatTo;
}();
