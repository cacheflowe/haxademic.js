/////////////////////////////////////////////
// DOM tests
/////////////////////////////////////////////

// header
mainEl.appendChild(DOMUtil.stringToDomElement("<h1>EasingFloatAccelerated</h1>"));

// scaling demo

// add label element to DOM
insertHtmlStr(`<code>EasingFloatAccelerated.update()</code>`);

// add test svg to dom
let svgToEasedX = DOMUtil.stringToDomElement(SVGUtil.testSVG);
mainEl.appendChild(svgToEasedX);

// animate scale, oscillating back & forth
let easedX = new EasingFloatAccelerated(0, 8);
function animateEasedX() {
  requestAnimationFrame(animateEasedX);
  easedX.update();
  if(easedX.value() == 0) easedX.setTarget(500);
  if(easedX.value() == 500) easedX.setTarget(0);
  svgToEasedX.style.transform = `translate3d(${easedX.value()}px, 0, 0)`;
}
animateEasedX();

// break
insertHtmlStr('<hr/>');

/////////////////////////////////////////////
// Unit tests
/////////////////////////////////////////////
