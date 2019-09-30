class LinearFloat {

  constructor(value = 0, inc = 0.025) {
    this.val = value;
    this.targetVal = value;
    this.inc = inc;
    this.delay = 0;
  }

  setValue( value ) {
  	this.val = value;
    return this;
  }

  setTarget( value ) {
  	this.targetVal = value;
    return this;
  }

  setInc( value ) {
  	this.inc = value;
    return this;
  }

  setDelay(frames) {
		this.delay = frames;
		return this;
	}

  value() {
  	return this.val;
  }

  valuePenner(equation) { // requires an equation from Penner class
  	return equation(this.val, 0, 1, 1);
  }

  valueMapped(min, max) { // requires an equation from Penner class
  	return this.map(this.val, 0, 1, min, max);
  }

  map(val, inputMin, inputMax, outputMin, outputMax) {
    return (outputMax - outputMin) * ((val - inputMin) / (inputMax - inputMin)) + outputMin;
  }

  target() {
  	return this.targetVal;
  }

  isComplete() {
    return this.val == this.targetVal;
  }

  update() {
    if(this.delay > 0) { this.delay--; return; }
  	if( this.val != this.targetVal ) {
  		var reachedTarget = false;
  		if( this.val < this.targetVal ) {
  			this.val += this.inc;
  			if( this.val > this.targetVal ) reachedTarget = true;
  		} else {
  			this.val -= this.inc;
  			if( this.val < this.targetVal ) reachedTarget = true;
  		}
  		if( reachedTarget == true ) {
  			this.val = this.targetVal;
  		}
  	}
    return this.val;
  }

}
