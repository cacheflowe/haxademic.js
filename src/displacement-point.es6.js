class DisplacementPoint {

  // ported from actionscript to javascript to java back to es6 :)
  // https://codepen.io/cacheflowe/pen/domZpQ

  constructor(baseX, baseY, baseZ, displaceRange = 40, friction = 0.8, acceleration = 0.1, displaceAmp = 1, influenceProximityRamp = 1.0) {
    // position/movement
    this.baseX = baseX;
    this.baseY = baseY;
    this.baseZ = baseZ;
    this.curX = baseX;
    this.curY = baseY;
    this.curZ = baseZ;
    this.targetX = baseX;
    this.targetY = baseY;
    this.targetZ = baseZ;
    this.speedX = 0;
    this.speedY = 0;
    this.speedZ = 0;

    // elasticity
    this.displaceRange = displaceRange;
    this.friction = friction;
    this.acceleration = acceleration;
    this.displaceAmp = displaceAmp;
    this.influenceProximityRamp = influenceProximityRamp;
    
    //results
    this.resultDisplacedAmp = 0;
  }

  getBaseX() { return this.baseX;}
  getBaseY() { return this.baseY; }
  getBaseZ() { return this.baseZ; }

  getCurX() { return this.curX; }
  getCurY() { return this.curY; }
  getCurZ() { return this.curZ; }
  
  getResultDisplacedAmp() { return this.resultDisplacedAmp; }

  setBasePos(baseX, baseY, baseZ) {
    this.baseX = baseX;
    this.baseY = baseY;
    this.baseZ = baseZ;
    return this;
  }

  setDisplaceRange(displaceRange) {
    this.displaceRange = displaceRange;
    return this;
  }

  setFriction(friction) {
    this.friction = friction;
    return this;
  }

  setAcceleration(acceleration) {
    this.acceleration = acceleration;
    return this;
  }

  setInfluenceDistance(influenceProximityRamp) {
    this.influenceProximityRamp = influenceProximityRamp;
    return this;
  }

  map(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
  }

  update(influenceX, influenceY, influenceZ) {
    // calculate displacement based on mouse distance from point base
    let xdiff = this.baseX - influenceX;
    let ydiff = this.baseY - influenceY;
    let zdiff = this.baseZ - influenceZ;
    let distFromInfluence = Math.sqrt(xdiff * xdiff + ydiff * ydiff + zdiff * zdiff);

		// further from influence point can become less effective, if we use the `influenceProximityRamp`
		let distFromInfluenceNorm = distFromInfluence / this.displaceRange;
		distFromInfluenceNorm = Math.max(0, Math.min(1, distFromInfluenceNorm));
		let adjustedDisplaceAmp = 1 - (distFromInfluenceNorm * this.influenceProximityRamp);
		this.resultDisplacedAmp = 1 - distFromInfluenceNorm;

    // update target this.based on influence point
    if (distFromInfluence < this.displaceRange) {
      this.targetX = this.baseX - (xdiff - this.displaceRange * (xdiff / distFromInfluence)) * (adjustedDisplaceAmp * this.displaceAmp);
      this.targetY = this.baseY - (ydiff - this.displaceRange * (ydiff / distFromInfluence)) * (adjustedDisplaceAmp * this.displaceAmp);
      this.targetZ = this.baseZ - (zdiff - this.displaceRange * (zdiff / distFromInfluence)) * (adjustedDisplaceAmp * this.displaceAmp);
    } else {
      this.targetX = this.baseX;
      this.targetY = this.baseY;
      this.targetZ = this.baseZ;
    }

    // elastically move based on current this.target position vs. current position
    this.speedX = ((this.targetX - this.curX) * this.acceleration + this.speedX) * this.friction;
    this.speedY = ((this.targetY - this.curY) * this.acceleration + this.speedY) * this.friction;
    this.speedZ = ((this.targetZ - this.curZ) * this.acceleration + this.speedZ) * this.friction;
    this.curX += this.speedX;
    this.curY += this.speedY;
    this.curZ += this.speedZ;

    // make chainable
    return this;
  }
}

export default DisplacementPoint;
