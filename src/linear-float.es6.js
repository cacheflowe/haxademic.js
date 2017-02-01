class LinearFloat {

  constructor(value = 0, inc = 0.025) {
    this.val = value;
    this.targetVal = value;
    this.inc = inc;
  }

  setValue( value ) {
  	this.val = value;
  }

  setTarget( value ) {
  	this.targetVal = value;
  }

  setInc( value ) {
  	this.inc = value;
  }

  value() {
  	return this.val;
  }

  valuePenner(equation) { // requires an equation from Penner class
  	return equation(this.val, 0, 1, 1);
  }

  target() {
  	return this.targetVal;
  }

  update() {
  	if( this.val != this.targetVal ) {
  		var switchedSides = false;
  		if( this.val < this.targetVal ) {
  			this.val += this.inc;
  			if( this.val > this.targetVal ) switchedSides = true;
  		} else {
  			this.val -= this.inc;
  			if( this.val < this.targetVal ) switchedSides = true;
  		}
  		if( switchedSides == true ) {
  			this.val = this.targetVal;
  		}
  	}
    return this.val;
  }

}
