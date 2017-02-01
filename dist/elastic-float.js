"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 *  An object that moves a point towards a target, with elastic properties.
 *  @param  x       Starting x coordinate.
 *  @param  y       Starting y coordinate.
 *  @param  fric    Friction value [0-1] - lower numbers mean more friction.
 *  @param  accel   Acceleration value [0-1] - lower numbers mean more slower acceleration.
 *  @return The ElasticFloat public interface.
 *  @use    {@code var _point = new ElasticFloat( 100, 100, 100, 0.75, 0.4 ); }
 */
var ElasticFloat = function () {
  function ElasticFloat() {
    var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    var fric = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0.8;
    var accel = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0.2;

    _classCallCheck(this, ElasticFloat);

    this.val = value;
    this.fric = fric;
    this.accel = accel;
    this.targetVal = this.val;
    this.speed = 0;
  }

  _createClass(ElasticFloat, [{
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
    key: "setCurrent",
    value: function setCurrent(value) {
      this.val = value;
    }
  }, {
    key: "setTarget",
    value: function setTarget(target) {
      this.targetVal = target;
    }
  }, {
    key: "setFriction",
    value: function setFriction(fric) {
      this.fric = fric;
    }
  }, {
    key: "setAccel",
    value: function setAccel(accel) {
      this.accel = accel;
    }
  }, {
    key: "update",
    value: function update() {
      this.speed = ((this.targetVal - this.val) * this.accel + this.speed) * this.fric;
      this.val += this.speed;
      return this.val;
    }
  }]);

  return ElasticFloat;
}();
