class LinearFloat {
  constructor(value = 0, inc = 0.025) {
    this.val = value;
    this.targetVal = value;
    this.delay = 0;
    this.setInc(inc);
  }

  setValue(value) {
    this.val = value;
    return this;
  }

  setTarget(value) {
    this.targetVal = value;
    return this;
  }

  setInc(inc) {
    this.inc = inc < 1 ? inc : 1 / inc; // if above 1, calculate number of frames to get there
    return this;
  }

  setDelay(frames) {
    this.delay = frames;
    return this;
  }

  value() {
    return this.val;
  }

  valuePenner(equation) {
    // requires an equation from Penner class
    return equation(this.val, 0, 1, 1);
  }

  valueMapped(min, max) {
    // requires an equation from Penner class
    return this.map(this.val, 0, 1, min, max);
  }

  map(val, inputMin, inputMax, outputMin, outputMax) {
    return (
      (outputMax - outputMin) * ((val - inputMin) / (inputMax - inputMin)) +
      outputMin
    );
  }

  target() {
    return this.targetVal;
  }

  isComplete() {
    return this.val === this.targetVal;
  }

  update() {
    if (this.delay > 0) {
      this.delay--;
      return;
    }
    if (this.val !== this.targetVal) {
      var reachedTarget = false;
      if (this.val < this.targetVal) {
        this.val += this.inc;
        if (this.val > this.targetVal) reachedTarget = true;
      } else {
        this.val -= this.inc;
        if (this.val < this.targetVal) reachedTarget = true;
      }
      if (reachedTarget === true) {
        this.val = this.targetVal;
      }
    }
    return this.val;
  }
}

export default LinearFloat;
