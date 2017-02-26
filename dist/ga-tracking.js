'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GATracking = function () {
  function GATracking() {
    var gaID = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

    _classCallCheck(this, GATracking);

    if (gaID != null) {
      if (gaId.indexOf('UA-') != -1) console.warn('Please only use the numeric GA tracking id');
      // https://developers.google.com/analytics/devguides/collection/analyticsjs/
      (function (i, s, o, g, r, a, m) {
        i['GoogleAnalyticsObject'] = r;i[r] = i[r] || function () {
          (i[r].q = i[r].q || []).push(arguments);
        }, i[r].l = 1 * new Date();a = s.createElement(o), m = s.getElementsByTagName(o)[0];a.async = 1;a.src = g;m.parentNode.insertBefore(a, m);
      })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');
      ga('create', 'UA-' + gaID, 'auto');
      ga('send', 'pageview');
    }
  }

  _createClass(GATracking, [{
    key: 'event',
    value: function event() {
      var category = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'test';
      var action = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'click';

      // More info: https://developers.google.com/analytics/devguides/collection/analyticsjs/events
      window.ga('send', 'event', category, action);
    }
  }, {
    key: 'page',
    value: function page() {
      var path = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document.location.pathname;

      // More info: https://developers.google.com/analytics/devguides/collection/analyticsjs/pages
      // More info: https://developers.google.com/analytics/devguides/collection/analyticsjs/single-page-applications
      window.ga('set', 'page', path); // sets the page for a single-page app, so subsequent events are tracked to this page
      window.ga('send', 'pageview');
    }
  }]);

  return GATracking;
}();
