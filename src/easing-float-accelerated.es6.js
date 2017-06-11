class EasingFloatAccelerated {

  constructor(value = 0, easeFactor = 8, completeRange = 0.001) {
    this.val = value;
    this.targetVal = value;
    this.easeFactor = easeFactor;
    this.completeRange = completeRange;
    this.speed = 0;
  }

  setTarget(value) {
    if(!isNaN(parseFloat(value))) this.targetVal = value;
  }

  setValue( value ) {
    this.val = value;
  }

  setEaseFactor( value ) {
    this.easeFactor = value;
  }

  value() {
    return this.val;
  }

  target() {
    return this.targetVal;
  }

  update() {
    if(this.val == this.targetVal) return;
    let increment = (this.targetVal - this.val ) / this.easeFactor;
    if(Math.abs(increment) > Math.abs(this.speed)) {
      this.speed += increment / (this.easeFactor * 2);
      increment = this.speed;
    } else {
      this.speed = increment;
    }
    this.val += increment;
    if(Math.abs(this.targetVal - this.val ) < this.completeRange) {
      this.val = this.targetVal;
    }
    return this.val;
  }

  updateRadians() {
    if( this.val == this.targetVal) return;
    var angleDifference = this.targetVal - this.val;
    var addToLoop = 0;
    if( angleDifference > Math.PI) {
      addToLoop = -EasingFloat.TWO_PI;
    } else if(angleDifference < -Math.PI ) {
      addToLoop = EasingFloat.TWO_PI;
    }
    this.val += ((this.targetVal - this.val + addToLoop) / this.easeFactor);
    if(Math.abs( this.val - this.targetVal ) < this.completeRange) {
      this.val = this.targetVal;
    }
  }
}

EasingFloat.TWO_PI = Math.PI * 2;
