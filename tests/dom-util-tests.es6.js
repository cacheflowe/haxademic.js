/////////////////////////////////////////////
// DOM tests
/////////////////////////////////////////////

// header
mainEl.appendChild(DOMUtil.stringToDomElement("<h1>DOMUtil</h1>"));

// add test svg to dom
insertHtmlStr(`<code>DOMUtil.stringToDomElement(SVGUtil.testSVG)</code>`);
let testEl = DOMUtil.stringToDomElement(SVGUtil.testSVG);
mainEl.appendChild(testEl);

// remove element from DOM
insertHtmlStr(`<code>DOMUtil.remove(el)</code>`);
let removeEl = DOMUtil.stringToDomElement('<span>remove me</span>');
mainEl.appendChild(removeEl);
DOMUtil.remove(removeEl);

// remove element from DOM
insertHtmlStr(`<code>DOMUtil.closest(el, selector)</code>`);
let closestEl = DOMUtil.stringToDomElement('<div class="test-closest"><span class="closest-inner">inner, inside .test-closest</span></div>');
mainEl.appendChild(closestEl);
let innerEl = mainEl.querySelector('.closest-inner');
DOMUtil.closest(innerEl, 'div.test-closest');

// break
insertHtmlStr('<hr/>');

/////////////////////////////////////////////
// Unit tests
/////////////////////////////////////////////

zoraTests
  .test('DOMUtil.stringToDomElement', function*(assert) {
    assert.ok(DOMUtil.stringToDomElement(SVGUtil.testSVG));
    assert.equal(svgEl.nodeName.toLowerCase(), 'svg');
  })
  .test('DOMUtil.closest', function*(assert) {
    assert.ok(DOMUtil.closest(innerEl, 'div.test-closest'));
    assert.equal(DOMUtil.closest(innerEl, 'div.test-closest').nodeName.toLowerCase(), 'div');
  })
