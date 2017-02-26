/////////////////////////////////////////////
// DOM tests
/////////////////////////////////////////////

// header
mainEl.appendChild(DOMUtil.stringToDomElement("<h1>Oscillations</h1>"));

// add test svg to dom
insertHtmlStr("<code>Oscillations.osc1</code>");
let svgToOscScale1 = DOMUtil.stringToDomElement(SVGUtil.testSVG);
mainEl.appendChild(svgToOscScale1);
insertHtmlStr("<code>Oscillations.osc2</code>");
let svgToOscScale2 = DOMUtil.stringToDomElement(SVGUtil.testSVG);
mainEl.appendChild(svgToOscScale2);
insertHtmlStr("<code>Oscillations.osc3</code>");
let svgToOscScale3 = DOMUtil.stringToDomElement(SVGUtil.testSVG);
mainEl.appendChild(svgToOscScale3);

// animate scale, oscillating back & forth
function animateOscillationsScale() {
  requestAnimationFrame(animateOscillationsScale);
  svgToOscScale1.style.transform = `scale(${0.6 + 0.4 * Oscillations.osc1(Date.now()/500.0)})`;
  svgToOscScale2.style.transform = `scale(${0.6 + 0.4 * Oscillations.osc2(Date.now()/1000.0)})`;
  svgToOscScale3.style.transform = `scale(${0.6 + 0.4 * Oscillations.osc3(Date.now()/500.0)})`;
}
animateOscillationsScale();

// break
insertHtmlStr('<hr/>');

/////////////////////////////////////////////
// Unit tests
/////////////////////////////////////////////
