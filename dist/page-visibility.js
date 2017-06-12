"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PageVisibility = function () {
  function PageVisibility(activeCallback, inactiveCallback) {
    _classCallCheck(this, PageVisibility);

    this.activeCallback = activeCallback || null;
    this.inactiveCallback = inactiveCallback || null;
    this.getPrefix();
    this.initPageVisibilityApi();
  }

  // from: http://www.sitepoint.com/introduction-to-page-visibility-api/


  _createClass(PageVisibility, [{
    key: "getPrefix",
    value: function getPrefix() {
      this.prefix = null;
      if (document.hidden !== undefined) this.prefix = "";else {
        var browserPrefixes = ["webkit", "moz", "ms", "o"];
        // Test all vendor prefixes
        for (var i = 0; i < browserPrefixes.length; i++) {
          if (document[browserPrefixes[i] + "Hidden"] != undefined) {
            this.prefix = browserPrefixes[i];
            break;
          }
        }
      }
    }
  }, {
    key: "updateState",
    value: function updateState(e) {
      if (document.hidden === false || document[this.prefix + "Hidden"] === false) {
        if (this.activeCallback != null) this.activeCallback();
      } else {
        if (this.inactiveCallback != null) this.inactiveCallback();
      }
    }
  }, {
    key: "initPageVisibilityApi",
    value: function initPageVisibilityApi() {
      var _this = this;

      if (this.prefix === null) console.log("Your browser does not support Page Visibility API");else {
        document.addEventListener(this.prefix + "visibilitychange", function (e) {
          return _this.updateState(e);
        });
        // this.updateState();
      }
    }
  }]);

  return PageVisibility;
}();
