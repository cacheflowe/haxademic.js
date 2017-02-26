"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LinearFloat = function () {
  function LinearFloat() {
    var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    var inc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0.025;

    _classCallCheck(this, LinearFloat);

    this.val = value;
    this.targetVal = value;
    this.inc = inc;
  }

  _createClass(LinearFloat, [{
    key: "setValue",
    value: function setValue(value) {
      this.val = value;
    }
  }, {
    key: "setTarget",
    value: function setTarget(value) {
      this.targetVal = value;
    }
  }, {
    key: "setInc",
    value: function setInc(value) {
      this.inc = value;
    }
  }, {
    key: "value",
    value: function value() {
      return this.val;
    }
  }, {
    key: "valuePenner",
    value: function valuePenner(equation) {
      // requires an equation from Penner class
      return equation(this.val, 0, 1, 1);
    }
  }, {
    key: "target",
    value: function target() {
      return this.targetVal;
    }
  }, {
    key: "update",
    value: function update() {
      if (this.val != this.targetVal) {
        var reachedTarget = false;
        if (this.val < this.targetVal) {
          this.val += this.inc;
          if (this.val > this.targetVal) reachedTarget = true;
        } else {
          this.val -= this.inc;
          if (this.val < this.targetVal) reachedTarget = true;
        }
        if (reachedTarget == true) {
          this.val = this.targetVal;
        }
      }
      return this.val;
    }
  }]);

  return LinearFloat;
}();
