/////////////////////////////////////////////
// DOM tests
/////////////////////////////////////////////

// header
mainEl.appendChild(DOMUtil.stringToDomElement("<h1>IframeUrlLoader</h1>"));

// re-cache a url
// let iFrameLoader = new IframeUrlLoader(IframeUrlLoader.recacheUrlForFB('https://aurafy.io'), () => {
let iFrameLoader = new IframeUrlLoader(IframeUrlLoader.recacheUrlForFB('https://s3-us-west-2.amazonaws.com/auarfy-images/gaia-aurafy-075b30db-5766-4945-9020-dc3b04d9d3ab.jpg'), () => {
  console.log('re-cached!');
});

// break
insertHtmlStr('<hr/>');

/////////////////////////////////////////////
// Unit tests
/////////////////////////////////////////////

// zoraTests
//   .test('ImprovedNoise.noise', function*(assert) {
//     assert.ok(improvedNoise.noise(Date.now()/10000, Date.now()/10200, Date.now()/10100));
//     assert.equal(improvedNoise.noise(.1, 0.2, 0.3), 0.35122924878110723);
//   })
