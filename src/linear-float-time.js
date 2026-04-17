class LinearFloatTime {
  constructor(value = 0, speed = 1.0) {
    this.val = value;
    this.targetVal = value;
    this.delay = 0;
    this.speed = speed;
  }

  setValue(value) {
    this.val = value;
    return this;
  }

  setTarget(value) {
    this.targetVal = value;
    return this;
  }

  setSpeed(speed) {
    this.speed = speed;
    return this;
  }

  setDelay(seconds) {
    this.delay = seconds;
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
    return (outputMax - outputMin) * ((val - inputMin) / (inputMax - inputMin)) + outputMin;
  }

  target() {
    return this.targetVal;
  }

  isComplete() {
    return this.val === this.targetVal;
  }

  update(dt) {
    if (this.delay > 0) {
      this.delay -= dt;
      return this.val;
    }
    if (this.val !== this.targetVal) {
      const step = dt / this.speed;
      if (this.val < this.targetVal) {
        this.val += step;
        if (this.val > this.targetVal) this.val = this.targetVal;
      } else {
        this.val -= step;
        if (this.val < this.targetVal) this.val = this.targetVal;
      }
    }
    return this.val;
  }
}

export default LinearFloatTime;
