class P5App extends p5 {
  
  constructor(el) {
    // pass in a function that's called by p5, passing back an instance of p5js as `p`
    super(p => p.bindAllMethods(p), el);
  }

  bindAllMethods(p) {
    console.log(p);
    // get all function names of this class
    // from: https://stackoverflow.com/a/40577337
    let methods = new Set();
    let protoRef = Reflect.getPrototypeOf(this);
    let keys = Reflect.ownKeys(protoRef)
    keys.forEach((k) => methods.add(k));
    
    // loop through, ignoring "constructor" and "bindAllMethods"
    // and bind to p5js
    // Optionally, this could be done manually done like so: 
    // p.setup = this.setup.bind(p);
    // p.draw = this.draw.bind(p);
    let exclude = ['constructor', 'bindAllMethods'];
    methods.forEach((fn) => {
      if(exclude.indexOf(fn) === -1) {
        p[fn] = this[fn].bind(p);
      }
    });
  }

  ctx() {
    return this.drawingContext;
  }

  containerEl() {
    return this._userNode;
  }
    return this.color(
      img.pixels[offset],
      img.pixels[offset + 1],
      img.pixels[offset + 2],
      img.pixels[offset + 3]
    );
  }

  // context helpers

  setBlurFilter(blurAmp=0) {
    if(blurAmp === 0) {
      this.ctx().filter = 'none';
    } else {
      this.ctx().filter = `blur(${blurAmp * this.pixelDensity()}px)`
    }
  }

  setShadow(blurAmp=0, color='black', offsetX=0, offsetY=5) {
    if(blurAmp === 0) {
      this.ctx().shadowBlur = blurAmp;
      this.ctx().shadowOffsetX = 0;
      this.ctx().shadowOffsetY = 0;
    } else {
      this.ctx().shadowBlur = blurAmp;
      this.ctx().shadowColor = color;
      this.ctx().shadowOffsetX = offsetX;
      this.ctx().shadowOffsetY = offsetY;
    }
  }

  setGlobalAlpha(alpha=1) {
    this.ctx().globalAlpha = alpha;
  }

  // gradients

  drawLinearGradientRect(stops=[{stop: 0, color: '#fff'}, {stop: 1, color: '#000'}], gradX=0, gradY=0, gradW=0, gradH=this.height, drawX=0, drawY=0, drawW=this.width, drawH=this.height) {
    var gradient = this.ctx().createLinearGradient(gradX, gradY, gradW, gradH);

    // Add three color stops
    stops.forEach(stop => gradient.addColorStop(stop.stop, stop.color));

    // Set the fill style and draw a rectangle
    this.ctx().fillStyle = gradient;
    this.ctx().fillRect(drawX, drawY, drawW, drawH);
  }

}

P5App.defaultVertShader = `
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

export default P5App;
