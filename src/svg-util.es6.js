class SVGUtil {

  static renderSVG(svgEl, renderedCallback, jpgQuality) {
    // WARNING! Inline <image> tags must have a base64-encoded image as their source. Linked image files will not work.
    // transform svg into base64 image
    const s = new XMLSerializer().serializeToString(svgEl);
    const uri = SVGUtil.dataImgPrefix + window.btoa(s);

    // load svg image into canvas
    const image = new Image();
    image.onload = function() {
      if(jpgQuality) {
        const canvas = SVGUtil.drawImageToNewCanvas(image, true);
        renderedCallback(canvas.toDataURL('image/jpeg', jpgQuality * 100));
      } else {
        const canvas = SVGUtil.drawImageToNewCanvas(image);
        renderedCallback(canvas.toDataURL('image/png'));
      }
    }
    image.src = uri;
  }

  static drawImageToNewCanvas(image, drawBackground) {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');
    if(drawBackground) { // set white background before rendering
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.drawImage(image, 0, 0);
    return canvas;
  }

  static setBase64ImageOnSvgImage(el, base64Img) {
    el.removeAttributeNS("http://www.w3.org/1999/xlink", "href");
    el.setAttributeNS("http://www.w3.org/1999/xlink", "href", base64Img);
  }
}

SVGUtil.clearColor = 'rgba(0,0,0,0)';
SVGUtil.dataImgPrefix = 'data:image/svg+xml;base64,';
SVGUtil.testSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><path d="M62.016 54.462L46.856 41.57c-1.567-1.41-3.243-2.06-4.597-1.996C45.836 35.382 48 29.944 48 24 48 10.747 37.253 0 24 0S0 10.747 0 24s10.744 24 24 24c5.943 0 11.38-2.16 15.573-5.74-.063 1.355.585 3.03 1.995 4.598l12.893 15.16c2.21 2.453 5.815 2.66 8.015.46s1.993-5.806-.46-8.014zM24 40c-8.836 0-16-7.163-16-16S15.163 8 24 8s16 7.163 16 16-7.163 16-16 16zm4-28h-8v8h-8v8h8v8h8v-8h8v-8h-8z"/></svg>';
