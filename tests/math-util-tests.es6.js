/////////////////////////////////////////////
// DOM tests
/////////////////////////////////////////////

// header
mainEl.appendChild(DOMUtil.stringToDomElement("<h1>MathUtil</h1>"));

// make a random number
insertHtmlStr(`<code>MathUtil.randRange(0, 10)</code> ${MathUtil.randRange(0, 10)}`);
insertHtmlStr(`<code>MathUtil.randRangeDecimel(0, 10)</code> ${MathUtil.randRangeDecimel(0, 10)}`);
insertHtmlStr(`<code>MathUtil.getPercentWithinRange(30, 40, 35)</code> ${MathUtil.getPercentWithinRange(30, 40, 35)}`);

// break
insertHtmlStr('<hr/>');

/////////////////////////////////////////////
// Unit tests
/////////////////////////////////////////////

zoraTests
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
