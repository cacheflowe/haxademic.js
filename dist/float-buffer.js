'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FloatBuffer = function () {
  function FloatBuffer(size) {
    _classCallCheck(this, FloatBuffer);

    this.size = size;
    this.initBuffer();
    this.reset();
  }

  _createClass(FloatBuffer, [{
    key: 'initBuffer',
    value: function initBuffer() {
      this.sampleIndex = 0;
      this.buffer = [];
      for (var i = 0; i < this.size; i++) {
        this.buffer.push(0);
      }
    }
  }, {
    key: 'reset',
    value: function reset() {
      for (var i = 0; i < this.size; i++) {
        this.buffer[i] = 0;
      }
    }
  }, {
    key: 'update',
    value: function update(value) {
      this.sampleIndex++;
      if (this.sampleIndex == this.size) this.sampleIndex = 0;
      this.buffer[this.sampleIndex] = value;
    }
  }, {
    key: 'sum',
    value: function sum() {
      return this.buffer.reduce(function (acc, val) {
        return acc + val;
      }, 0);
    }
  }, {
    key: 'sumPositive',
    value: function sumPositive() {
      return this.buffer.reduce(function (acc, val) {
        return val > 0 ? acc + val : acc;
      }, 0);
    }
  }, {
    key: 'sumNegative',
    value: function sumNegative() {
      return this.buffer.reduce(function (acc, val) {
        return val < 0 ? acc + val : acc;
      }, 0);
    }
  }, {
    key: 'toString',
    value: function toString() {
      return this.buffer.reduce(function (acc, val) {
        return acc + ', ' + Math.round(val * 10) / 10;
      }, '');
    }
  }, {
    key: 'max',
    value: function max() {
      var max = this.buffer[0];
      for (var i = 1; i < this.size; i++) {
        if (this.buffer[i] > max) max = this.buffer[i];
      }
      return max;
    }
  }, {
    key: 'min',
    value: function min() {
      var min = this.buffer[0];
      for (var i = 1; i < this.size; i++) {
        if (this.buffer[i] < min) min = this.buffer[i];
      }
      return min;
    }
  }, {
    key: 'average',
    value: function average() {
      return this.sum / this.size;
    }
  }, {
    key: 'absSum',
    value: function absSum() {
      var absSum = 0;
      for (var i = 0; i < this.size; i++) {
        absSum += Math.abs(this.buffer[i]);
      }
      return absSum;
    }
  }, {
    key: 'absMax',
    value: function absMax() {
      var max = Math.abs(this.buffer[0]);
      for (var i = 1; i < this.size; i++) {
        if (Math.abs(this.buffer[i]) > max) max = Math.abs(this.buffer[i]);
      }
      return max;
    }
  }]);

  return FloatBuffer;
}();
