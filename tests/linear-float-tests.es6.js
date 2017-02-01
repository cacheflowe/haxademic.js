/////////////////////////////////////////////
// DOM tests
/////////////////////////////////////////////

// header
mainEl.appendChild(DOMUtil.stringToDomElement("<h1>LinearFloat</h1>"));

// add label element to DOM
insertHtmlStr(`<code>LinearFloat.update()</code> <span class="linear-scale-display"></span>`);
let linearScaleDisplayEl = document.querySelector('.linear-scale-display');

// add test svg to dom
let svgToLinearScale = DOMUtil.stringToDomElement(SVGUtil.testSVG);
mainEl.appendChild(svgToLinearScale);

// animate scale, oscillating back & forth
let linearScale = new LinearFloat();
function animateLinearScale() {
  requestAnimationFrame(animateLinearScale);
  linearScale.update();
  if(linearScale.value() == 0) linearScale.setTarget(1);
  if(linearScale.value() == 1) linearScale.setTarget(0);
  svgToLinearScale.style.transform = `scale(${linearScale.value()})`;
}
animateLinearScale();

// break
insertHtmlStr('<hr/>');

/////////////////////////////////////////////
// Unit tests
/////////////////////////////////////////////
