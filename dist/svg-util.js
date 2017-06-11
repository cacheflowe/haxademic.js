'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SVGUtil = function () {
  function SVGUtil() {
    _classCallCheck(this, SVGUtil);
  }

  _createClass(SVGUtil, null, [{
    key: 'rasterizeSVG',
    value: function rasterizeSVG(svgEl, renderedCallback, jpgQuality) {
      // WARNING! Inline <image> tags must have a base64-encoded image as their source. Linked image files will not work.
      // transform svg into base64 image
      var s = new XMLSerializer().serializeToString(svgEl);
      var uri = SVGUtil.dataImgPrefix + window.btoa(s);

      // load svg image into canvas
      var image = new Image();
      image.onload = function () {
        if (jpgQuality) {
          var canvas = SVGUtil.drawImageToNewCanvas(image, true);
          renderedCallback(canvas.toDataURL('image/jpeg', jpgQuality));
        } else {
          var _canvas = SVGUtil.drawImageToNewCanvas(image);
          renderedCallback(_canvas.toDataURL('image/png'));
        }
      };
      image.src = uri;
    }
  }, {
    key: 'drawImageToNewCanvas',
    value: function drawImageToNewCanvas(image, drawBackground) {
      var canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      var context = canvas.getContext('2d');
      if (drawBackground) {
        // set white background before rendering
        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.drawImage(image, 0, 0);
      return canvas;
    }
  }, {
    key: 'elementToString',
    value: function elementToString(el) {
      return el.outerHTML;
    }
  }, {
    key: 'setBase64ImageOnSvgImage',
    value: function setBase64ImageOnSvgImage(el, base64Img) {
      el.removeAttributeNS("http://www.w3.org/1999/xlink", "href");
      el.setAttributeNS("http://www.w3.org/1999/xlink", "href", base64Img);
    }
  }, {
    key: 'svgStrToBase64',
    value: function svgStrToBase64(svgStr) {
      return 'data:image/svg+xml;base64,' + btoa(svgStr);
    }
  }, {
    key: 'svgElToBase64',
    value: function svgElToBase64(el, callback) {
      return SVGUtil.svgStrToBase64(el.outerHTML);
    }
  }]);

  return SVGUtil;
}();

SVGUtil.clearColor = 'rgba(0,0,0,0)';
SVGUtil.dataImgPrefix = 'data:image/svg+xml;base64,';
SVGUtil.testSVG = '<svg xmlns="http://www.w3.org/2000/svg" height="100" width="100"><circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red"/></svg>';
SVGUtil.testSVG2 = '<svg xmlns="http://www.w3.org/2000/svg" height="100" width="100"><rect x="10" y="10" width="80" height="80" stroke="black" stroke-width="3" fill="red"/></svg>';
