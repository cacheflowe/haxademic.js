"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EasyScroll = function () {
  function EasyScroll() {
    var scrollEl = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : window;

    _classCallCheck(this, EasyScroll);

    this.scrollEl = scrollEl;
    this.startScrollY = 0;
    this.scrollDist = 0;
    this.frame = 0;
    this.frames = 0;
  }

  _createClass(EasyScroll, [{
    key: "easeInOutQuad",
    value: function easeInOutQuad(t, b, c, d) {
      if ((t /= d / 2) < 1) return c / 2 * t * t + b;
      return -c / 2 * (--t * (t - 2) - 1) + b;
    }
  }, {
    key: "animateScroll",
    value: function animateScroll() {
      var _this = this;

      this.frame++;
      if (this.frame <= this.frames) requestAnimationFrame(function () {
        return _this.animateScroll();
      });
      var percentComplete = this.frame / this.frames;
      var scrollProgress = this.scrollDist * this.easeInOutQuad(percentComplete, 0, 1, 1);
      if (this.scrollEl == window) {
        window.scrollTo(0, Math.round(this.startScrollY - scrollProgress));
      } else {
        this.scrollEl.scrollTop = Math.round(this.startScrollY - scrollProgress);
      }
    }
  }, {
    key: "scrollByY",
    value: function scrollByY(duration, scrollAmount) {
      var _this2 = this;

      this.startScrollY = this.scrollEl == window ? window.scrollY : this.scrollEl.scrollTop;
      this.scrollDist = scrollAmount;
      this.frame = 0;
      this.frames = Math.floor(duration / 16);
      requestAnimationFrame(function () {
        return _this2.animateScroll();
      });
    }
  }, {
    key: "scrollToEl",
    value: function scrollToEl(duration, el, offset) {
      var pageOffset = this.scrollEl == window ? 0 : this.scrollEl.getBoundingClientRect().top;
      this.scrollByY(duration, -el.getBoundingClientRect().top + offset + pageOffset);
    }
  }, {
    key: "setScrollEl",
    value: function setScrollEl(el) {
      this.scrollEl = el;
    }
  }]);

  return EasyScroll;
}();
