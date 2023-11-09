import EasingFloat from './easing-float.js'

class EasingColor {

  constructor(...args) {
    // build easing values
    this.colorR = new EasingFloat();
    this.colorG = new EasingFloat();
    this.colorB = new EasingFloat();
    this.colorA = new EasingFloat();

    // set color based on arguments
    // hex string or int
    if(args.length == 1) { this.setHex(args[0]); }
    // hex string or int w/easeFactor
    if(args.length == 2) { this.setHex(args[0]); this.setEaseFactor(args[1]); }
    // r, g, b
    if(args.length == 3) this.setRgba(args[0], args[1], args[2], 255);
    // r, g, b, a
    if(args.length == 4) this.setRgba(args[0], args[1], args[2], args[3]);
    // r, g, b, a, easeFactor
    if(args.length == 5) { this.setRgba(args[0], args[1], args[2], args[3]); this.setEaseFactor(args[4]); }

    // set target to be same as initial value
    this.setTargetRgba(this.getR(), this.getG(), this.getB(), this.getA());
  }
  
  /////////////////////
  // SETTERS
  /////////////////////

  setHex(hex) {
    if(typeof hex == 'string') {
      this.setHexAndAlpha(hex);
    } else {
      this.setRgbInt(hex);
    }
  }
  
  setTargetHex(hex) {
    if(typeof hex == 'string') {
      this.setTargetHexAndAlpha(hex);
    } else {
      this.setTargetColorInt(hex);
    }
  }
  
  setHexAndAlpha(hex, alpha=255) {
    // parse hex string
    hex = hex.replace("#", "");
    if(hex.length == 8) { 
      // store & pop off alpha 
      alpha = parseInt(hex.substring( 0, 2 ), 16 );
      hex = hex.substring(2, 8);
    }
    this.setRgba(
      parseInt(hex.substring(0, 2), 16),
      parseInt(hex.substring(2, 4), 16),
      parseInt(hex.substring(4, 6), 16),
      alpha
    );
  }
  
  setTargetHexAndAlpha(hex, alpha=255) {
    // parse hex string
    hex = hex.replace("#", "");
    if(hex.length == 8) { 
      // store & pop off alpha 
      alpha = parseInt(hex.substring( 0, 2 ), 16 );
      hex = hex.substring(2, 8);
    }
    this.setTargetRgba(
      parseInt(hex.substring(0, 2), 16),
      parseInt(hex.substring(2, 4), 16),
      parseInt(hex.substring(4, 6), 16),
      alpha
    );
  }
  
  setRgbInt(hex) {
    let hexStr = EasingColor.rgbIntToHexString(hex);
    this.setHexAndAlpha(hexStr);
    return this;
  }
  
  setTargetRgbInt(hex) {
    let hexStr = EasingColor.rgbIntToHexString(hex);
    this.setTargetHexAndAlpha(hexStr);
    return this;
  }
  
  setRgbaInt(hex) {
    let hexStr = EasingColor.rgbaIntToHexString(hex);
    this.setHexAndAlpha(hexStr);
    return this;
  }
  
  setTargetRgbaInt(hex) {
    let hexStr = EasingColor.rgbaIntToHexString(hex);
    this.setTargetHexAndAlpha(hexStr);
    return this;
  }
  
  setEaseFactor(easeFactor) {
    this.colorR.setEaseFactor(easeFactor);
    this.colorG.setEaseFactor(easeFactor);
    this.colorB.setEaseFactor(easeFactor);
    this.colorA.setEaseFactor(easeFactor);
  }

  setR(r) { this.colorR.setValue(r); return this; }
  setG(g) { this.colorG.setValue(g); return this; }
  setB(b) { this.colorB.setValue(b); return this; }
  setA(a) { this.colorA.setValue(a); return this; }

  setTargetR(r) { this.colorR.setTarget(r); return this; }
  setTargetG(g) { this.colorG.setTarget(g); return this; }
  setTargetB(b) { this.colorB.setTarget(b); return this; }
  setTargetA(a) { this.colorA.setTarget(a); return this; }

  setRgb(r, g, b) {
    this.colorR.setValue(r);
    this.colorG.setValue(g);
    this.colorB.setValue(b);
    return this;
  }  

  setRgba(r, g, b, a) {
    this.setRgb(r, g, b);
    this.colorA.setValue(a);
    return this;
  }  

  setTargetRgb(r, g, b) {
    this.colorR.setTarget(r);
    this.colorG.setTarget(g);
    this.colorB.setTarget(b);
    return this;
  }

  setTargetRgba(r, g, b, a) {
    this.setTargetRgb(r, g, b);
    this.colorA.setTarget(a);
    return this;
  }

  /////////////////////
  // GETTERS
  /////////////////////

  getR() { return this.colorR.value(); }
  getG() { return this.colorG.value(); }
  getB() { return this.colorB.value(); }
  getA() { return this.colorA.value(); }

  getTargetR() { return this.colorR.target(); }
  getTargetG() { return this.colorG.target(); }
  getTargetB() { return this.colorB.target(); }
  getTargetA() { return this.colorA.target(); }

  getRNorm() { return this.getR() / 255; }
  getGNorm() { return this.getG() / 255; }
  getBNorm() { return this.getB() / 255; }
  getANorm() { return this.getA() / 255; }

  getTargetRNorm() { return this.getTargetR() / 255; }
  getTargetGNorm() { return this.getTargetG() / 255; }
  getTargetBNorm() { return this.getTargetB() / 255; }
  getTargetANorm() { return this.getTargetA() / 255; }

  getRgbHex() {
    return EasingColor.rgbToHexString(
      Math.round(this.colorR.value()), 
      Math.round(this.colorG.value()), 
      Math.round(this.colorB.value())
    );
  }

  getRgbaString() {
    return `rgba(${this.colorR.value().toFixed(3)}, ${this.colorG.value().toFixed(3)}, ${this.colorB.value().toFixed(3)}, ${(this.colorA.value() / 255).toFixed(3)})`;
  }

  getRgbaInt() {
    return EasingColor.rgbaToColorInt(Math.round(this.colorR.value()), Math.round(this.colorG.value()), Math.round(this.colorB.value()), Math.round(this.colorA.value()));
  }

  /////////////////////
  // ANIMATE
  /////////////////////

  update() {
    this.colorR.update(true);
    this.colorG.update(true);
    this.colorB.update(true);
    this.colorA.update(true);
  }

  /////////////////////
  // CONVERSION
  /////////////////////


  static rgbToHexString(r, g, b) {
    return "#" + Number(0x1000000 + r*0x10000 + g*0x100 + b).toString(16).substring(1);
  }
  
  static rgbToColorInt(r, g, b) {
    return Number("0x"+ Number(0x1000000 + r*0x10000 + g*0x100 + b).toString(16).substring(1));
  }

  static rgbaToColorInt(r, g, b, a) {
    return Number("0x"+ Number(a*0x1000000 + r*0x10000 + g*0x100 + b).toString(16).substring(1));
  }

  static rgbIntToHexString(colorInt) {
    return "#"+((colorInt)>>>0).toString(16).slice(-6);
  }
  
  static rgbaIntToHexString(colorInt) {
    return "#"+((colorInt)>>>0).toString(16).slice(-8);
  }

  static randomColorHex() {
    return Math.floor(Math.random()*16777215).toString(16);
  }

}

export default EasingColor;