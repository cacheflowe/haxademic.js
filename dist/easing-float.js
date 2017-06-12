"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EasingFloat = function () {
  function EasingFloat() {
    var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    var easeFactor = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 8;
    var completeRange = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0.001;

    _classCallCheck(this, EasingFloat);

    this.val = value;
    this.targetVal = value;
    this.easeFactor = easeFactor;
    this.completeRange = completeRange;
    this.speed = 0;
  }

  _createClass(EasingFloat, [{
    key: "setTarget",
    value: function setTarget(value) {
      if (!isNaN(parseFloat(value))) this.targetVal = value;
    }
  }, {
    key: "setValue",
    value: function setValue(value) {
      this.val = value;
    }
  }, {
    key: "setEaseFactor",
    value: function setEaseFactor(value) {
      this.easeFactor = value;
    }
  }, {
    key: "value",
    value: function value() {
      return this.val;
    }
  }, {
    key: "target",
    value: function target() {
      return this.targetVal;
    }
  }, {
    key: "update",
    value: function update() {
      var accelerates = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      // don't do any math if we're already at the destination
      if (this.val == this.targetVal) return;
      // interpolate
      if (accelerates == false) {
        this.val += (this.targetVal - this.val) / this.easeFactor;
      } else {
        var increment = (this.targetVal - this.val) / this.easeFactor;
        if (Math.abs(increment) > Math.abs(this.speed)) {
          this.speed += increment / this.easeFactor;
          increment = this.speed;
        } else {
          this.speed = increment;
        }
        this.val += increment;
      }
      // set the value to the target if we're close enough
      if (Math.abs(this.targetVal - this.val) < this.completeRange) {
        this.val = this.targetVal;
      }
      return this.val;
    }
  }, {
    key: "updateRadians",
    value: function updateRadians() {
      if (this.val == this.targetVal) return;
      var angleDifference = this.targetVal - this.val;
      var addToLoop = 0;
      if (angleDifference > Math.PI) {
        addToLoop = -EasingFloat.TWO_PI;
      } else if (angleDifference < -Math.PI) {
        addToLoop = EasingFloat.TWO_PI;
      }
      this.val += (this.targetVal - this.val + addToLoop) / this.easeFactor;
      if (Math.abs(this.val - this.targetVal) < this.completeRange) {
        this.val = this.targetVal;
      }
    }
  }]);

  return EasingFloat;
}();

EasingFloat.TWO_PI = Math.PI * 2;
