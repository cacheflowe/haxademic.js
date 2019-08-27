if(window.p5) {
  class P {}
  P.p = null;
  window.P = P;
  window.p = null;

  class P5Sketch extends p5 {

    constructor(el=document.body, id='p5') {
      super(p => {
        // do any setup in here that needs to happen before the sketch starts
        // (e.g. create event handlers)
        // `p` refers to the instance that becomes `this` after the super() call
      });
      P.p = window.p = this;
      this.setup = this.setup.bind(this);
      this.draw = this.draw.bind(this);
      // this.start = this.start.bind(this);
      // this.stop = this.stop.bind(this);
      this.windowResized = this.windowResized.bind(this);

      // store elements
      this.el = el;
      this.elSize = this.el.getBoundingClientRect();
    }

    setup() {
      this.createCanvas(this.elSize.width, this.elSize.height, p5.prototype.WEBGL);
      this.el.appendChild(this.canvas);
      this.background(0);
      this.setupFirstFrame();
    }

    setupFirstFrame() {
      // override this!
    }

    draw() {
      // override this!
      this.background(127 + 127 * Math.sin(this.frameCount * 0.01));
    }

    windowResized() {
      this.elSize = this.el.getBoundingClientRect();
      this.resizeCanvas(this.elSize.width, this.elSize.height);
    }

    // addFrameListener(fn) {
    //   this.app.ticker.add(fn);
    // }

    width() {
      return this.elSize.width;
    }

    height() {
      return this.elSize.height;
    }

  }

  P5Sketch.defaultVertShader = `
  // vertex shader
  attribute vec3 aPosition;
  attribute vec2 aTexCoord;
  varying vec2 vTexCoord;
  void main() {
    vTexCoord = aTexCoord;
    vec4 positionVec4 = vec4(aPosition, 1.0);
    positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
    // positionVec4.xy = positionVec4.xy - 0.5;
    gl_Position = positionVec4;
  }
  `;

  window.P5Sketch = P5Sketch;
}
