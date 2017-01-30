// add test svg to dom
let svgEl = DOMUtil.stringToDomElement(SVGUtil.testSVG);
document.body.appendChild(svgEl);

// turn it into a png image
SVGUtil.renderSVG(svgEl, (base64Img) => {
  let svgImg = document.createElement('img');
  svgImg.src = base64Img;
  document.body.appendChild(svgImg);
});

// turn it into a jpg image
SVGUtil.renderSVG(svgEl, (base64Img) => {
  let svgImg = document.createElement('img');
  svgImg.src = base64Img;
  document.body.appendChild(svgImg);
}, 0.8);
