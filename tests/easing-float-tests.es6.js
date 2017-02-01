/////////////////////////////////////////////
// DOM tests
/////////////////////////////////////////////

// header
mainEl.appendChild(DOMUtil.stringToDomElement("<h1>EasingFloat</h1>"));

// add label element to DOM
insertHtmlStr(`<code>EasingFloat.update()</code> <span class="eased-scale-display"></span>`);
let easedScaleDisplayEl = document.querySelector('.eased-scale-display');

// add test svg to dom
let svgToEasedScale = DOMUtil.stringToDomElement(SVGUtil.testSVG);
mainEl.appendChild(svgToEasedScale);

// animate scale, oscillating back & forth
let easedScale = new EasingFloat();
function animateEasedScale() {
  requestAnimationFrame(animateEasedScale);
  easedScale.update();
  if(easedScale.value() == 0) easedScale.setTarget(1);
  if(easedScale.value() == 1) easedScale.setTarget(0);
  svgToEasedScale.style.transform = `scale(${easedScale.value()})`;
}
animateEasedScale();

// break
insertHtmlStr('<hr/>');

/////////////////////////////////////////////
// Unit tests
/////////////////////////////////////////////
