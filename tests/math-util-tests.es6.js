/////////////////////////////////////////////
// DOM tests
/////////////////////////////////////////////

// header
mainEl.appendChild(DOMUtil.stringToDomElement("<h1>MathUtil</h1>"));

// show function
function appendTest(str) {
  let el = document.createElement('div');
  el.innerHTML = str;
  mainEl.appendChild(el);
}

// make a random number
appendTest(`MathUtil.randRange(0, 10) | ${MathUtil.randRange(0, 10)}`);
appendTest(`MathUtil.randRangeDecimel(0, 10) | ${MathUtil.randRangeDecimel(0, 10)}`);
appendTest(`MathUtil.getPercentWithinRange(30, 40, 35) | ${MathUtil.getPercentWithinRange(30, 40, 235)}`);

/////////////////////////////////////////////
// Unit tests
/////////////////////////////////////////////

Zora()
  .test('MathUtil.randRange', function*(assert) {
    assert.ok(MathUtil.randRange(0, 10));
    assert.equal(MathUtil.randRange(0, 0), 0);
  })
  .test('MathUtil.randRangeDecimel', function*(assert) {
    assert.ok(MathUtil.randRangeDecimel(0, 10));
    assert.equal(MathUtil.randRangeDecimel(0, 0), 0);
  })
  .test('MathUtil.getPercentWithinRange', function*(assert) {
    assert.ok(MathUtil.getPercentWithinRange(30, 40, 35));
    assert.equal(MathUtil.getPercentWithinRange(30, 40, 35), 0.5);
  })
  .run();
