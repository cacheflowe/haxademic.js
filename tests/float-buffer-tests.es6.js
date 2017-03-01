/////////////////////////////////////////////
// DOM tests
/////////////////////////////////////////////

// header
mainEl.appendChild(DOMUtil.stringToDomElement("<h1>FloatBuffer</h1>"));

// insert title and result holder
insertHtmlStr(`<code>new FloatBuffer(20)</code>`);
insertHtmlStr(`<code>FloatBuffer.sum()</code> <span class="float-buffer-sum"></span>`);
let bufferSum = document.querySelector('.float-buffer-sum');
insertHtmlStr(`<code>FloatBuffer.sumPositive()</code> <span class="float-buffer-sum-positive"></span>`);
let bufferSumPositive = document.querySelector('.float-buffer-sum-positive');
insertHtmlStr(`<code>FloatBuffer.sumNegative()</code> <span class="float-buffer-sum-negative"></span>`);
let bufferSumNegative = document.querySelector('.float-buffer-sum-negative');
insertHtmlStr(`<code>FloatBuffer.toString()</code> <span class="float-buffer-tostring"></span>`);
let bufferToString = document.querySelector('.float-buffer-tostring');

// animate noise
let floatBuffer = new FloatBuffer(20);
function animateFloatBuffer() {
  requestAnimationFrame(animateFloatBuffer);
  floatBuffer.update(Math.sin(Date.now() / 3000));
  bufferSum.innerHTML = floatBuffer.sum();
  bufferSumPositive.innerHTML = floatBuffer.sumPositive();
  bufferSumNegative.innerHTML = floatBuffer.sumNegative();
  bufferToString.innerHTML = floatBuffer.toString();
}
animateFloatBuffer();

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
