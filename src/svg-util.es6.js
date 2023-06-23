class SVGUtil {
  static svgToUniformPoints(svg, pointSpacing = 5) {
    let points = [];
    let paths = svg.querySelectorAll("path");
    paths.forEach((path) => {
      let svgLength = path.getTotalLength();
      let numPointsPerPath = Math.floor(svgLength / pointSpacing);
      let distPerPoint = svgLength / numPointsPerPath;
      for (let i = 0; i < numPointsPerPath; i++) {
        let point = path.getPointAtLength(i * distPerPoint);
        points.push([point.x, point.y]);
      }
    });
    return points;
  }

  static normalizeAndCenterPoints(points) {
    const xArr = points.map((c) => c[0]);
    const yArr = points.map((c) => c[1]);
    const l = Math.min(...xArr);
    const r = Math.max(...xArr);
    const b = Math.min(...yArr);
    const t = Math.max(...yArr);
    const width = r - l;
    const height = t - b;

    const offsetX = (r - l) / 2;
    const offsetY = (t - b) / 2;
    const scale = 1 / Math.max(width, height);

    // console.log(l, r, b, t);
    // console.log("offset", offsetX, offsetY);
    // console.log("shape size", width, height);

    let pointsNorm = points.map((s) => {
      let x = (s[0] - offsetX) * scale;
      let y = (s[1] - offsetY) * scale;
      return [x, y];
    });
    return pointsNorm;
  }

  static rasterizeSVG(svgEl, renderedCallback, jpgQuality) {
    // WARNING! Inline <image> tags must have a base64-encoded image as their source. Linked image files will not work.
    // transform svg into base64 image
    const s = new XMLSerializer().serializeToString(svgEl);
    const uri = SVGUtil.dataImgPrefix + window.btoa(s);

    // load svg image into canvas
    const image = new Image();
    image.onload = function () {
      if (jpgQuality) {
        const canvas = SVGUtil.drawImageToNewCanvas(image, true);
        renderedCallback(canvas.toDataURL("image/jpeg", jpgQuality));
      } else {
        const canvas = SVGUtil.drawImageToNewCanvas(image);
        renderedCallback(canvas.toDataURL("image/png"));
      }
    };
    image.src = uri;
  }

  static drawImageToNewCanvas(image, drawBackground) {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d");
    if (drawBackground) {
      // set white background before rendering
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.drawImage(image, 0, 0);
    return canvas;
  }

  static async injectSvgFromFile(url, parent) {
    const response = await fetch(url);
    const text = await response.text();
    let doc = new DOMParser().parseFromString(text, "text/html"); // from DOMUtil
    let el = doc.body.firstElementChild;
    parent.append(el);
    return el;
  }

  static async loadSvgFile(url) {
    const response = await fetch(url);
    const text = await response.text();
    let doc = new DOMParser().parseFromString(text, "text/html"); // from DOMUtil
    return doc.body.firstElementChild;
  }

  static elementToString(el) {
    return el.outerHTML;
  }

  static setBase64ImageOnSvgImage(el, base64Img) {
    el.removeAttributeNS("http://www.w3.org/1999/xlink", "href");
    el.setAttributeNS("http://www.w3.org/1999/xlink", "href", base64Img);
  }

  static svgStrToBase64(svgStr) {
    return "data:image/svg+xml;base64," + btoa(svgStr);
  }

  static svgElToBase64(el, callback) {
    return SVGUtil.svgStrToBase64(el.outerHTML);
  }

  static polygonsToPaths(el) {
    var polys = el.querySelectorAll("polygon,polyline");
    [].forEach.call(polys, convertPolyToPath);

    function convertPolyToPath(poly) {
      var svgNS = poly.ownerSVGElement.namespaceURI;
      var path = document.createElementNS(svgNS, "path");
      var pathdata = "M " + poly.getAttribute("points");
      if (poly.tagName == "polygon") pathdata += "z";
      if (poly.getAttribute("id"))
        path.setAttribute("id", poly.getAttribute("id"));
      if (poly.getAttribute("fill"))
        path.setAttribute("fill", poly.getAttribute("fill"));
      if (poly.getAttribute("stroke"))
        path.setAttribute("stroke", poly.getAttribute("stroke"));
      path.setAttribute("d", pathdata);
      poly.parentNode.replaceChild(path, poly);
    }
  }
}

SVGUtil.clearColor = "rgba(0,0,0,0)";
SVGUtil.dataImgPrefix = "data:image/svg+xml;base64,";
SVGUtil.testSVG =
  '<svg xmlns="http://www.w3.org/2000/svg" height="100" width="100"><circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red"/></svg>';
SVGUtil.testSVG2 =
  '<svg xmlns="http://www.w3.org/2000/svg" height="100" width="100"><rect x="10" y="10" width="80" height="80" stroke="black" stroke-width="3" fill="red"/></svg>';

export default SVGUtil;
