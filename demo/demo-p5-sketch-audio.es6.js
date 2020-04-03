class P5SketchAudioDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [
      "../vendor/p5/p5.js",
      "../vendor/p5/addons/p5.sound.min.js",
      "../src/p5-sketch.es6.js",
    ], `
      <div class="container">
        <h1>P5Sketch</h1>
        <div id="p5-sketch" style="height: 400px;"></div>
      </div>
    `);
  }

  init() {
    // init custom sketch subclass
    this.buildSubclass();
    this.p5El = document.getElementById('p5-sketch');
    this.p5Sketch = new CustomSketch(this.p5El);
  }

  buildSubclass() {

    // create custom p5 sketch subclass
    class CustomSketch extends P5Sketch {

      setupFirstFrame() {
        // store main renderer canvas as a p5.Element. this prevents error when calling pg.image()
        this.mainCanvas = new p5.Element(this.canvas, this);

        // load microphone(?)
        this.micInput = true;
        if(this.micInput) {
          this.mic = new p5.AudioIn();
          this.mic.start();
          this.fft = new p5.FFT();
          this.fft.setInput(this.mic);
        }

        // load shaders
        this.lightLeakShader = p.createShader(P5Sketch.defaultVertShader, `
          // from: http://glslsandbox.com/e#24303.0
          precision mediump float;
          varying vec2 vTexCoord;
          uniform float iTime;
          const float Pi = 3.14159;
          void main() {
          	vec2 p = vTexCoord.xy;

          	for(int i = 1; i < 6; i++) {
          		vec2 newp = p;
          		newp.x += 0.6 / float(i) * cos(float(i) * p.y + (iTime * 10.0) / 10.0 + 0.3 * float(i)) + 400. / 20.0;
          		newp.y += 0.6 / float(i) * cos(float(i) * p.x + (iTime * 10.0) / 10.0 + 0.3 * float(i + 10)) - 400. / 20.0 + 15.0;
          		p = newp;
          	}
          	vec3 col = vec3(0.5 * sin(3.0 * p.x) + 0.5, 0.5 * sin(3.0 * p.y) + 0.5, sin(p.x + p.y));
          	gl_FragColor = vec4(col, 1.0);
          }
        `);

        this.lumaShader = p.createShader(P5Sketch.defaultVertShader, `
            precision mediump float;
            varying vec2 vTexCoord;
            uniform sampler2D tex;

            float luma(vec3 color) {
              return dot(color, vec3(0.299, 0.587, 0.114));
            }

            void main() {
              vec2 uv = vTexCoord;
              uv.y = 1.0 - uv.y;                          // the texture is loaded upside down and backwards by default so lets flip it
              vec4 texColor = texture2D(tex, uv * 0.5);   // depending on how createGraphics is set, somehow had to halve the uv coords
              float gray = luma(texColor.rgb);            // convert the texture to grayscale by using the luma function
              gl_FragColor = vec4(vec3(gray), 1.);
            }
          `);

          this.glitchShader = p.createShader(P5Sketch.defaultVertShader, `
            precision mediump float;
            varying vec2 vTexCoord;
            uniform sampler2D tex;
            uniform float iTime;
            uniform float amp;

            float rand () {
              return fract(sin(iTime)*1e4);
            }
            void main() {
              vec2 uv = vTexCoord;
              uv.y = 1.0 - uv.y;
              uv *= 0.5;
              vec4 origColor = texture2D(tex, uv);
              vec2 uvR = uv;
              vec2 uvB = uv;
              uvR.x = uv.x * 1.0 - rand() * 0.02 * 0.8;
              uvB.y = uv.y * 1.0 + rand() * 0.02 * 0.8;

              //
              if(uv.y < rand() && uv.y > rand() -0.1 && sin(iTime) < 0.0) {
                uv.x = (uv + 0.2 * rand()).x;
                if(uv.x < 0.) uv.x = 0.;
                else if(uv.x > 1.) uv.x = 1.;
              }

              //
              vec4 c;
              c.r = texture2D(tex, uvR).r;
              c.g = texture2D(tex, uv).g;
              c.b = texture2D(tex, uvB).b;
              c.a = 1.;

              //
              float scanline = sin( uv.y * 80.0 * rand())/30.0;
              c *= 1.0 - scanline;

              gl_FragColor = mix(origColor, c, amp);
            }
          `);

          // create pg for post-processing
          this.pg = this.createGraphics(p.width, p.height);//, p5.prototype.WEBGL, this);
          this.pg.background(0);
      }

      draw() {
        // draw background
        // if(p.frameCount % 15 < 5)
        p.background(100 + 55 * Math.sin(p.frameCount * 0.09), 0, 0, 0);
        // p.fill(0, 5);
        // p.rect(0, 0, this.width, this.height);

        // draw shape
        p.fill(255);
        p.noStroke();
        p.translate(-p.width/2, -p.height/2, 1);
        p.circle(p.width/2 + p.width * 0.25 * Math.sin(p.frameCount * 0.05), p.height/2, 100);

        if(this.micInput == true) {
          let spectrum = this.fft.analyze();
          this.drawAudioSpectrum(spectrum);
          this.drawAudioDots(spectrum);
        }

        // copy main canvas to pg for shader texture input
        this.pg.image(this.mainCanvas, 0, 0, this.pg.width, this.pg.height); // -this.pg.width/2, -this.pg.height/2);
        // this.pg.image(this.drawingContext, 0, 0);
        // this.pg.copy(p, 0, 0, this.pg.width, this.pg.height, 0, 0, this.pg.width, this.pg.height);

        // framerate
        // p.fill(255);
        // p.stroke(255);
        // p.text(p.frameRate+"", 20, 20);

        // run shader. rect supplies geometry to affect
        if(this.frameCount % 100 < 50) {
          // test shader
          // this.lumaShader.setUniform('tex', this.pg);
          // p.shader(this.lumaShader);
          // p.rect(0, 0, this.width, this.height);
          // p.resetShader();

          // apply glitch shader
          this.glitchShader.setUniform('tex', this.pg);
          this.glitchShader.setUniform('iTime', this.frameCount * 0.1);
          this.glitchShader.setUniform('amp', 1.);
          p.shader(this.glitchShader);
          p.rect(0, 0, this.width, this.height);
          p.resetShader();
        }
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
    window.CustomSketch = CustomSketch;
  }
}


if(window.autoInitDemo) new P5SketchAudioDemo(document.body);
