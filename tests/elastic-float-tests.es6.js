/////////////////////////////////////////////
// DOM tests
/////////////////////////////////////////////

// header
mainEl.appendChild(DOMUtil.stringToDomElement("<h1>ElasticFloat</h1>"));

// add label element to DOM
insertHtmlStr(`<code>ElasticFloat.update()</code> <span class="elastic-scale-display"></span>`);
let elasticScaleDisplayEl = document.querySelector('.elastic-scale-display');

// add test svg to dom
let svgToElasticScale = DOMUtil.stringToDomElement(SVGUtil.testSVG);
mainEl.appendChild(svgToElasticScale);

// animate scale, oscillating back & forth
const elasticScale = new ElasticFloat();
function animateElasticScale() {
  requestAnimationFrame(animateElasticScale);
  elasticScale.update();
  const curValue = (elasticScale.value() > 0) ? elasticScale.value() : 0;
  svgToElasticScale.style.transform = `scale(${curValue})`;
}
animateElasticScale();

// pick a new scale target every second
setInterval(() => {
  const newScale = (elasticScale.value() > 0.5) ? 0 : 1;
  elasticScale.setTarget(newScale);
}, 2000);

// break
insertHtmlStr('<hr/>');

/////////////////////////////////////////////
// Unit tests
/////////////////////////////////////////////
