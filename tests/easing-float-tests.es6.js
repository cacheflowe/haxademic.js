/////////////////////////////////////////////
// DOM tests
/////////////////////////////////////////////

// header
mainEl.appendChild(DOMUtil.stringToDomElement("<h1>EasingFloat</h1>"));

// scaling demo

// add label element to DOM
insertHtmlStr(`<code>EasingFloat.update()</code>`);

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

// rotating demo

// add label element to DOM
insertHtmlStr(`<code>EasingFloat.updateRadians()</code> <span class="eased-rotate-display"></span>`);
let easedRotateDisplayEl = document.querySelector('.eased-rotate-display');

// add test svg to dom
let svgToEasedRotate = DOMUtil.stringToDomElement(SVGUtil.testSVG2);
mainEl.appendChild(svgToEasedRotate);

// animate rotation, oscillating back & forth
let easedRotation = new EasingFloat();
var easeRotFrames = 0;
function animateEasedRotation() {
  easeRotFrames++;
  requestAnimationFrame(animateEasedRotation);
  easedRotation.updateRadians();
  if(easeRotFrames % 60 == 0) {
    let newRadians = -Math.PI * 2 + Math.random() * Math.PI * 4;
    easedRotation.setTarget(newRadians);
    easedRotateDisplayEl.innerHTML = `${MathUtil.roundToDecimal(newRadians, 2)}rad`
  }
  svgToEasedRotate.style.transform = `rotate(${easedRotation.value()}rad)`;
}
animateEasedRotation();


// acceleration demo

// add label element to DOM
insertHtmlStr(`<code>EasingFloat.update(true)</code> (w/acceleration)`);

// add test svg to dom
let svgToEasedX = DOMUtil.stringToDomElement(SVGUtil.testSVG);
mainEl.appendChild(svgToEasedX);

// animate scale, oscillating back & forth
let easedX = new EasingFloat(0, 8);
function animateEasedX() {
  requestAnimationFrame(animateEasedX);
  easedX.update(true);
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
