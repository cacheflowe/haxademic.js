/////////////////////////////////////////////
// DOM tests
/////////////////////////////////////////////

// header
mainEl.appendChild(DOMUtil.stringToDomElement("<h1>StringFormatter</h1>"));

// make a random number
insertHtmlStr(`<code>StringFormatter.formatPhone('3035558888')</code> ${StringFormatter.formatPhone('3035558888')}`);
insertHtmlStr(`<code>StringFormatter.formatSSN('333002222')</code> ${StringFormatter.formatSSN('333002222')}`);
insertHtmlStr(`<code>StringFormatter.formatCreditCard('1111-2222-3333-4444')</code> ${StringFormatter.formatCreditCard('1111-2222-3333-4444')}`);
insertHtmlStr(`<code>StringFormatter.formatNumber('$303.33')</code> ${StringFormatter.formatNumber('$303.33')}`);
insertHtmlStr(`<code>StringFormatter.formatDollarsCents('303.333333')</code> ${StringFormatter.formatDollarsCents('303.333333')}`);
insertHtmlStr(`<code>StringFormatter.addCommasToNumber('3000000')</code> ${StringFormatter.addCommasToNumber('3000000')}`);
insertHtmlStr(`<code>StringFormatter.timeFromSeconds(30000, true)</code> ${StringFormatter.timeFromSeconds(30000, true)}`);

// break
insertHtmlStr('<hr/>');

/////////////////////////////////////////////
// Unit tests
/////////////////////////////////////////////

zoraTests
  .test('StringFormatter.formatPhone', function*(assert) {
    assert.ok(StringFormatter.formatPhone('3035558888'));
    assert.equal(StringFormatter.formatPhone('3035558888'), '(303) 555-8888');
  })
  .test('StringFormatter.formatSSN', function*(assert) {
    assert.ok(StringFormatter.formatSSN('333002222'));
    assert.equal(StringFormatter.formatSSN('333002222'), '333-00-2222');
  })
  .test('StringFormatter.formatCreditCard', function*(assert) {
    assert.ok(StringFormatter.formatCreditCard('1111-2222-3333-4444'));
    assert.equal(StringFormatter.formatCreditCard('1111-2222-3333-4444'), '1111 2222 3333 4444');
  })
  .test('StringFormatter.formatNumber', function*(assert) {
    assert.ok(StringFormatter.formatNumber('$303.33'));
    assert.equal(StringFormatter.formatNumber('$303.33'), '303.33');
  })
  .test('StringFormatter.formatDollarsCents', function*(assert) {
    assert.ok(StringFormatter.formatDollarsCents('303.333333'));
    assert.equal(StringFormatter.formatDollarsCents('303.333333'), '303.33');
  })
  .test('StringFormatter.addCommasToNumber', function*(assert) {
    assert.ok(StringFormatter.addCommasToNumber('3000000'));
    assert.equal(StringFormatter.addCommasToNumber('3000000'), '3,000,000');
  })
  .test('StringFormatter.timeFromSeconds', function*(assert) {
    assert.ok(StringFormatter.timeFromSeconds(30000, true));
    assert.equal(StringFormatter.timeFromSeconds(30000, true), '08:20:00');
  })
