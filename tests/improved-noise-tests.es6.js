/////////////////////////////////////////////
// DOM tests
/////////////////////////////////////////////

// header
mainEl.appendChild(DOMUtil.stringToDomElement("<h1>ImprovedNoise</h1>"));

// insert title and result holder
insertHtmlStr(`<code>ImprovedNoise.noise()</code> <span class="noise-display"></span>`);
let noiseDisplayEl = document.querySelector('.noise-display');

// animate noise
let improvedNoise = new ImprovedNoise();
function animateNoise() {
  requestAnimationFrame(animateNoise);
  noiseDisplayEl.innerHTML = improvedNoise.noise(Date.now()/10000, Date.now()/10200, Date.now()/10100);
}
animateNoise();

// break
insertHtmlStr('<hr/>');

/////////////////////////////////////////////
// Unit tests
/////////////////////////////////////////////

zora.test('ImprovedNoise.noise', function*(assert) {
    assert.ok(improvedNoise.noise(Date.now()/10000, Date.now()/10200, Date.now()/10100));
    assert.equal(improvedNoise.noise(.1, 0.2, 0.3), 0.35122924878110723);
  })
