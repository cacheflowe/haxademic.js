'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DOMUtil = function () {
  function DOMUtil() {
    _classCallCheck(this, DOMUtil);
  }

  _createClass(DOMUtil, null, [{
    key: 'closest',
    value: function closest(element, selector) {
      selector = selector.toLowerCase();
      var className = selector.split('.').length > 1 ? selector.split('.')[1] : '';
      selector = selector.split('.')[0];
      while (true) {
        if (element.nodeName.toLowerCase() === selector && element.className.indexOf(className) !== -1) {
          return element;
        }
        if (!(element = element.parentNode)) {
          break;
        }
      }
      return null;
    }
  }, {
    key: 'remove',
    value: function remove(el) {
      if (el && el.parentNode) {
        return el.parentNode.removeChild(el);
      }
      return null;
    }
  }, {
    key: 'stringToDomElement',
    value: function stringToDomElement(str) {
      var div = document.createElement('div');
      div.innerHTML = str;
      return div.firstChild;
    }
  }]);

  return DOMUtil;
}();
