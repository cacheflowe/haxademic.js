/////////////////////////////////////////////
// DOM tests
/////////////////////////////////////////////

// header
mainEl.appendChild(DOMUtil.stringToDomElement("<h1>MobileUtil</h1>"));

// make a random number
insertHtmlStr(`<code>MobileUtil.isMobileBrowser()</code> ${MobileUtil.isMobileBrowser()}`);
insertHtmlStr(`<code>MobileUtil.isIOS()</code> ${MobileUtil.isIOS()}`);
insertHtmlStr(`<code>MobileUtil.isIPhone()</code> ${MobileUtil.isIPhone()}`);
insertHtmlStr(`<code>MobileUtil.isAndroid()</code> ${MobileUtil.isAndroid()}`);
insertHtmlStr(`<code>MobileUtil.isSafari()</code> ${MobileUtil.isSafari()}`);

// break
insertHtmlStr('<hr/>');

/////////////////////////////////////////////
// Unit tests
/////////////////////////////////////////////

zoraTests
  .test('MobileUtil.enablePseudoStyles', function*(assert) {
    assert.notOk(MobileUtil.enablePseudoStyles());
  })
  .test('MobileUtil.lockTouchScreen', function*(assert) {
    assert.notOk(MobileUtil.lockTouchScreen(true));
    assert.notOk(MobileUtil.lockTouchScreen(false));
  })
  .test('MobileUtil.hideSoftKeyboard', function*(assert) {
    assert.notOk(MobileUtil.hideSoftKeyboard());
  })
  .test('MobileUtil.unlockWebAudioOnTouch()', function*(assert) {
    assert.notOk(MobileUtil.unlockWebAudioOnTouch());
  })
  .test('MobileUtil.playEmptyWebAudioSound()', function*(assert) {
    assert.notOk(MobileUtil.playEmptyWebAudioSound());
  })
  .test('MobileUtil.isMobileBrowser()', function*(assert) {
    MobileUtil.isMobileBrowser();
  })
  .test('MobileUtil.isIOS()', function*(assert) {
    MobileUtil.isIOS();
  })
  .test('MobileUtil.isIPhone()', function*(assert) {
    MobileUtil.isIPhone();
  })
  .test('MobileUtil.isAndroid()', function*(assert) {
    MobileUtil.isAndroid();
  })
  .test('MobileUtil.isSafari()', function*(assert) {
    MobileUtil.isSafari();
  })
  // .test('MobileUtil.randRangeDecimel', function*(assert) {
  //   assert.ok(MobileUtil.randRangeDecimel(0, 10));
  //   assert.equal(MobileUtil.randRangeDecimel(0, 0), 0);
  // })
  // .test('MobileUtil.getPercentWithinRange', function*(assert) {
  //   assert.ok(MobileUtil.getPercentWithinRange(30, 40, 35));
  //   assert.equal(MobileUtil.getPercentWithinRange(30, 40, 35), 0.5);
  // })
