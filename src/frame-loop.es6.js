class FrameLoop {

  constructor(frames=60, ticks=4) {
	  this.frame = 1;
	  this.loopFrames = frames;
	  this.loopCurFrame = 1;
	  this.progress = 0;
	  this.progressRads = 0;
	  this.ticks = ticks;
	  this.curTick = -1;
	  this.isTick = false;
    this.listeners = [];
    this.animate();
  }

  // listeners

  addListener(obj) {
    this.listeners.push(obj);
  }

  removeListener(obj) {
    const index = this.listeners.indexOf(obj);
    if (index !== -1) this.listeners.splice(index, 1);
  }

  // requestAnimationFrame

  animate() {
    // animate loop
    requestAnimationFrame(() => this.animate());
    this.listeners.forEach((el) => {
      if(el.frameLoop) el.frameLoop(this.frame);
      else throw new Error('FrameLoop listener has no frameLoop()');
    });
    // update counts for next frame
    this.frame++;
    if(this.loopFrames > 0) {
			this.loopCurFrame = this.frame % this.loopFrames;
			this.progress = this.loopCurFrame / this.loopFrames;
			this.progressRads = this.progress * Math.PI * 2;
			
			// update ticks
			let newTick = Math.floor(this.ticks * this.progress);
			this.isTick = (this.curTick != newTick);
			this.curTick = newTick;
		}
  }

  // getters

  count(mult=1) {
		return this.frame * mult;
	}

  osc(mult, low, high) {
		let range = (high - low) * 0.5;
		let mid = low + range;
		return mid + Math.sin(this.count(mult)) * range;
	}

  frameMod(mod, frameInLoop=1) {
		return this.frame % mod == frameInLoop;
	}

  frameModSeconds(seconds) {
		return this.frame % Math.round(seconds * 60) == 1;    // assumes 60 frames per second
	}

  frameModMinutes(minutes) {
		return this.frame % Math.round(minutes * 3600) == 1;		// 60 frames * 60 seconds
	}

  frameModHours(ours) {
		return this.frame % Math.round(hours * 216000) == 1;		// 60 frames * 60 seconds * 60 minutes
	}

  getLoopCurFrame() {
		return this.loopCurFrame;
	}

  getProgress() {
		return this.progress;
	}

  getProgressRads() {
		return this.progressRads;
	}

  getCurTick() {
		return this.curTick;
	}

  getIsTick() {
		return this.isTick;
	}
}
