"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CanvasFilters = function () {
  function CanvasFilters() {
    _classCallCheck(this, CanvasFilters);
  }

  _createClass(CanvasFilters, null, [{
    key: "createImageData",
    value: function createImageData(w, h) {
      return CanvasFilters.tmpCtx.createImageData(w, h);
    }
  }, {
    key: "getCanvasImageData",


    // helpers to overwrite canvas that's getting filtered
    value: function getCanvasImageData(canvas) {
      var w = canvas.width;
      var h = canvas.height;
      var ctx = canvas.getContext("2d");
      var imageData = ctx.getImageData(0, 0, w, h);
      return imageData;
    }
  }, {
    key: "getCanvasContext",
    value: function getCanvasContext(canvas) {
      return canvas.getContext("2d");
    }

    // from: https://gist.github.com/doctyper/992342
    // Desaturate Usage:

  }, {
    key: "desaturate",
    value: function desaturate(canvas) {
      var imageData = CanvasFilters.getCanvasImageData(canvas);
      var pixels = imageData.data;
      for (var i = 0; i < pixels.length; i += 4) {
        var avg = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        pixels[i] = avg; // red
        pixels[i + 1] = avg; // green
        pixels[i + 2] = avg; // blue
      }
      CanvasFilters.getCanvasContext(canvas).putImageData(imageData, 0, 0);
    }
  }, {
    key: "saturation",


    // from: https://github.com/meltingice/CamanJS/blob/master/src/lib/filters.coffee
    // Range is -1 to 1. Values < 0 will desaturate the image while values > 0 will saturate it.
    value: function saturation(canvas, adjustment) {
      adjustment *= -1;
      var imageData = CanvasFilters.getCanvasImageData(canvas);
      var pixels = imageData.data;
      for (var i = 0; i < pixels.length; i += 4) {
        var max = Math.max(pixels[i], pixels[i + 1], pixels[i + 2]);
        if (pixels[i] != max) pixels[i] += (max - pixels[i]) * adjustment;
        if (pixels[i + 1] != max) pixels[i + 1] += (max - pixels[i + 1]) * adjustment;
        if (pixels[i + 2] != max) pixels[i + 2] += (max - pixels[i + 2]) * adjustment;
      }
      CanvasFilters.getCanvasContext(canvas).putImageData(imageData, 0, 0);
    }
  }, {
    key: "brightness",
    value: function brightness(canvas, adjustment) {
      adjustment *= 255;
      var imageData = CanvasFilters.getCanvasImageData(canvas);
      var pixels = imageData.data;

      for (var i = 0; i < pixels.length; i += 4) {
        pixels[i] += adjustment;
        pixels[i + 1] += adjustment;
        pixels[i + 2] += adjustment;
      }
      CanvasFilters.getCanvasContext(canvas).putImageData(imageData, 0, 0);
    }
  }, {
    key: "contrastImage",


    // from: http://stackoverflow.com/questions/10521978/html5-canvas-image-contrast
    value: function contrastImage(canvas, contrast) {
      var imageData = CanvasFilters.getCanvasImageData(canvas);
      var pixels = imageData.data;

      var factor = 259 * (contrast + 255) / (255 * (259 - contrast));

      for (var i = 0; i < pixels.length; i += 4) {
        pixels[i] = factor * (pixels[i] - 128) + 128;
        pixels[i + 1] = factor * (pixels[i + 1] - 128) + 128;
        pixels[i + 2] = factor * (pixels[i + 2] - 128) + 128;
      }
      CanvasFilters.getCanvasContext(canvas).putImageData(imageData, 0, 0);
    }

    // special convolution filter codes from:
    // http://www.html5rocks.com/en/tutorials/canvas/imagefilters/

  }, {
    key: "convolute",
    value: function convolute(pixels, weights, opaque) {
      var side = Math.round(Math.sqrt(weights.length));
      var halfSide = Math.floor(side / 2);

      var src = pixels.data;
      var sw = pixels.width;
      var sh = pixels.height;

      var w = sw;
      var h = sh;
      var output = CanvasFilters.createImageData(w, h);
      var dst = output.data;

      var alphaFac = opaque ? 1 : 0;

      for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
          var sy = y;
          var sx = x;
          var dstOff = (y * w + x) * 4;
          var r = 0;
          var g = 0;
          var b = 0;
          var a = 0;
          for (var cy = 0; cy < side; cy++) {
            for (var cx = 0; cx < side; cx++) {
              var scy = Math.min(sh - 1, Math.max(0, sy + cy - halfSide));
              var scx = Math.min(sw - 1, Math.max(0, sx + cx - halfSide));
              var srcOff = (scy * sw + scx) * 4;
              var wt = weights[cy * side + cx];
              r += src[srcOff] * wt;
              g += src[srcOff + 1] * wt;
              b += src[srcOff + 2] * wt;
              a += src[srcOff + 3] * wt;
            }
          }
          dst[dstOff] = r;
          dst[dstOff + 1] = g;
          dst[dstOff + 2] = b;
          dst[dstOff + 3] = a + alphaFac * (255 - a);
        }
      }
      return output;
    }
  }, {
    key: "sharpen",
    value: function sharpen(canvas) {
      var filteredPixels = CanvasFilters.convolute(CanvasFilters.getCanvasImageData(canvas), [0, -1, 0, -1, 5, -1, 0, -1, 0], false);
      CanvasFilters.getCanvasContext(canvas).putImageData(filteredPixels, 0, 0);
    }
  }]);

  return CanvasFilters;
}();

CanvasFilters.tmpCanvas = document.createElement('canvas');
CanvasFilters.tmpCtx = CanvasFilters.tmpCanvas.getContext('2d');
