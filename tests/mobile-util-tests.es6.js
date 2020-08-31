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

zora.test('MobileUtil.enablePseudoStyles', function*(assert) {
    assert.notOk(MobileUtil.enablePseudoStyles());
  })
zora.test('MobileUtil.lockTouchScreen', function*(assert) {
    assert.notOk(MobileUtil.lockTouchScreen(true));
    assert.notOk(MobileUtil.lockTouchScreen(false));
  })
zora.test('MobileUtil.hideSoftKeyboard', function*(assert) {
    assert.notOk(MobileUtil.hideSoftKeyboard());
  })
zora.test('MobileUtil.unlockWebAudioOnTouch()', function*(assert) {
    assert.notOk(MobileUtil.unlockWebAudioOnTouch());
  })
zora.test('MobileUtil.playEmptyWebAudioSound()', function*(assert) {
    assert.notOk(MobileUtil.playEmptyWebAudioSound());
  })
zora.test('MobileUtil.isMobileBrowser()', function*(assert) {
    MobileUtil.isMobileBrowser();
  })
zora.test('MobileUtil.isIOS()', function*(assert) {
    MobileUtil.isIOS();
  })
zora.test('MobileUtil.isIPhone()', function*(assert) {
    MobileUtil.isIPhone();
  })
zora.test('MobileUtil.isAndroid()', function*(assert) {
    MobileUtil.isAndroid();
  })
zora.test('MobileUtil.isSafari()', function*(assert) {
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
