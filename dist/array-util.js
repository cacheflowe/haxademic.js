"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ArrayUtil = function () {
  function ArrayUtil() {
    _classCallCheck(this, ArrayUtil);
  }

  _createClass(ArrayUtil, null, [{
    key: "shuffleArray",
    value: function shuffleArray(array) {
      array.sort(function () {
        return 0.5 - Math.random();
      });
    }
  }, {
    key: "randomElementFromArr",
    value: function randomElementFromArr(array) {
      return array[MathUtil.randRange(0, array.length - 1)];
    }
  }, {
    key: "uniqueArray",
    value: function uniqueArray(array) {
      return array.filter(function (el, i, arr) {
        return arr.indexOf(el) === i; // only return the first instance of an element
      });
    }
  }]);

  return ArrayUtil;
}();
