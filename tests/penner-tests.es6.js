/////////////////////////////////////////////
// DOM tests
/////////////////////////////////////////////

// header
mainEl.appendChild(DOMUtil.stringToDomElement("<h1>Penner Equations</h1>"));

// add label element to DOM
insertHtmlStr(`<code>Penner.easeInOutExpo</code> <span class="panner-scale-display"></span>`);
let pannerScaleDisplayEl = document.querySelector('.panner-scale-display');

// add test svg to dom
let svgToPennerScale = DOMUtil.stringToDomElement(SVGUtil.testSVG);
mainEl.appendChild(svgToPennerScale);

// animate scale, oscillating back & forth
let linearPennerScale = new LinearFloat(0, 0.017);
function animatePennerScale() {
  requestAnimationFrame(animatePennerScale);
  linearPennerScale.update();
  if(linearPennerScale.value() == 0) linearPennerScale.setTarget(1);
  if(linearPennerScale.value() == 1) linearPennerScale.setTarget(0);
  svgToPennerScale.style.transform = `scale(${linearPennerScale.valuePenner(Penner.easeInOutExpo)})`;
}
animatePennerScale();

// break
insertHtmlStr('<hr/>');

/////////////////////////////////////////////
// Unit tests
/////////////////////////////////////////////
