// header
mainEl.appendChild(DOMUtil.stringToDomElement("<h1>SVGUtil</h1>"));

// add test svg to dom
let svgEl = DOMUtil.stringToDomElement(SVGUtil.testSVG);
mainEl.appendChild(svgEl);

// turn it into a png image
SVGUtil.renderSVG(svgEl, (base64Img) => {
  let svgImg = document.createElement('img');
  svgImg.src = base64Img;
  mainEl.appendChild(svgImg);
});

// turn it into a jpg image
SVGUtil.renderSVG(svgEl, (base64Img) => {
  let svgImg = document.createElement('img');
  svgImg.src = base64Img;
  mainEl.appendChild(svgImg);
}, 0.8);
