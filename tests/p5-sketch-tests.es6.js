/////////////////////////////////////////////
// DOM tests
/////////////////////////////////////////////

// header
mainEl.appendChild(DOMUtil.stringToDomElement("<h1>P5Sketch</h1>"));

// create log output element
insertHtmlStr(`<div id="p5-sketch" style="height: 400px;"></div>`);
let p5El = document.getElementById('p5-sketch');

// create custom p5 sketch subclass
class CustomSketch extends P5Sketch {

  setupFirstFrame() {
    this.mic = new p5.AudioIn();
    this.mic.start();
    this.fft = new p5.FFT();
    this.fft.setInput(this.mic);
  }

  draw() {
    p.background(127 + 127 * Math.sin(p.frameCount * 0.03), 0, 0);
    let spectrum = this.fft.analyze();
    this.drawAudioSpectrum(spectrum);
    this.drawAudioDots(spectrum);
  }

  drawAudioSpectrum(spectrum) {
    // fft demo data
    p.beginShape();
    p.noStroke();
    p.fill(255);
    for (var i = 0; i < spectrum.length; i++) {
      p.vertex(i, p.map(spectrum[i], 0, 255, this.height, 0));
    }
    p.endShape();
  }

  drawAudioDots(spectrum) {
    p.noStroke();
    var x = 0;
    var y = 0;
    let spacing = 20;
    var i = 0;
    while (y < this.height) {
      // draw dot
      p.fill(255, spectrum[i % 200]);
      p.circle(x, y, spacing * 0.5);

      // increment grid position
      x += spacing;
      i++;
      if(x > this.width) {
        x = 0;
        y += spacing;
      }
    }
  }
}

// init custom sketch
let p5Sketch = new CustomSketch(p5El);


// break
insertHtmlStr('<hr/>');

/////////////////////////////////////////////
// Unit tests
/////////////////////////////////////////////
