class PointerPos {

  constructor(callbackMove, callbackStart, callbackEnd) {
    // store options
    this.callbackMove = callbackMove;
    this.callbackStart = callbackStart;
    this.callbackEnd = callbackEnd;
    this.curX = -1;
    this.curY = -1;
    this.lastX = -1;
    this.lastY = -1;
    this.totalDeltaX = 0;
    this.totalDeltaY = 0;
    this.pointerActive = false;
    this.pointerCount = 0;
    this.cancelClickThresh = 8;
    this.isTouchEvents = false;
    this.hasCheckedTouchEvents = false;
    this.addListeners();
  }

  // listeners

  addListeners() {
    // add mouse/touch listeners
    this.startListener = this.pointerStart.bind(this);
    this.moveListener = this.pointerMove.bind(this);
    this.endListener = this.pointerEnd.bind(this);
    document.addEventListener('mousedown', this.startListener);
    document.addEventListener('mousemove', this.moveListener);
    document.addEventListener('mouseup', this.endListener);
    document.addEventListener('touchstart', this.startListener);
    document.addEventListener('touchmove', this.moveListener);
    document.addEventListener('touchend', this.endListener);
  }

  removeTouchListeners() {
    document.removeEventListener('touchstart', this.startListener);
    document.removeEventListener('touchmove', this.moveListener);
    document.removeEventListener('touchend', this.endListener);
  }

  removeMouseListeners() {
    document.removeEventListener('mousedown', this.startListener);
    document.removeEventListener('mousemove', this.moveListener);
    document.removeEventListener('mouseup', this.endListener);
  }

  checkInputType(e) {
    if(this.hasCheckedTouchEvents) return;
    this.isTouchEvents = (e.type == "touchstart");
    if(this.isTouchEvents) {
      this.removeMouseListeners();
    } else {
      this.removeTouchListeners();
    }
    this.hasCheckedTouchEvents = true;
  }

  pointerStart(e) {
    this.checkInputType(e);
    this.curX = (this.isTouchEvents) ? e.touches[0].clientX : e.clientX;
    this.curY = (this.isTouchEvents) ? e.touches[0].clientY : e.clientY;
    this.pointerCount = (this.isTouchEvents) ? e.touches.length : 1;
    this.lastX = this.curX;
    this.lastY = this.curY;
    this.totalDeltaX = 0;
    this.totalDeltaY = 0;
    this.pointerActive = true;
    if(this.callbackStart) this.callbackStart();
  }

  pointerMove(e) {
    let x = (this.isTouchEvents) ? e.touches[0].clientX : e.clientX;
    let y = (this.isTouchEvents) ? e.touches[0].clientY : e.clientY;
    this.pointerCount = (this.isTouchEvents) ? e.touches.length : 1;
    this.lastX = this.curX;
    this.lastY = this.curY;
    this.curX = x;
    this.curY = y;
    let deltaX = this.curX - this.lastX;
    let deltaY = this.curY - this.lastY;
    if(this.pointerActive) {
      this.totalDeltaX += Math.abs(deltaX);
      this.totalDeltaY += Math.abs(deltaY);
    }
    if(this.callbackMove && this.pointerActive) this.callbackMove(this.curX, this.curY, deltaX, deltaY);
  }

  pointerEnd(e) {
    this.pointerCount = (this.isTouchEvents) ? e.touches.length : 0;
    this.pointerActive = false;
    if(this.callbackEnd) this.callbackEnd();
  }

  // position

  x(el=null) {
    if(el) {
      var offset = el.getBoundingClientRect();
      return this.curX - offset.left;
    }
    return this.curX;
  };

  y(el=null) {
    if(el) {
      var offset = el.getBoundingClientRect();
      return this.curY - offset.top;
    }
    return this.curY;
  };

  xNorm(el) {
    if(el) {
      var offset = el.getBoundingClientRect();
      var relativeX = this.curX - offset.left;
      return relativeX / offset.width;
    }
    return this.curX / window.innerWidth;
  };

  yNorm(el) {
    if(el) {
      var offset = el.getBoundingClientRect();
      var relativeY = this.curY - offset.top;
      return relativeY / offset.height;
    }
    return this.curY / window.innerHeight;
  };

  xDelta() {
    return this.curX - this.lastX;
  };

  yDelta() {
    return this.curY - this.lastY;
  };

  xDeltaTotal() {
    return this.totalDeltaX;
  };

  yDeltaTotal() {
    return this.totalDeltaY;
  };

  // state

  isTouchInput() {
    return this.isTouchEvents;
  }

  isTouching() {
    return this.pointerActive;
  }

  numPointers() {
    return this.pointerCount;
  }

  setCancelClickThresh(thresh) {
    this.cancelClickThresh = thresh;
  }

  pastDragThreshold() {
    return this.totalDeltaX + this.totalDeltaY > this.cancelClickThresh;
  }

  insideEl(el) {
    let x = this.xNorm(el);
    let y = this.yNorm(el);
    return (x >= 0 && x <= 1 && y >= 0 && y <= 1);
  }

  dispose() {
    this.removeMouseListeners();
    this.removeTouchListeners();
    this.pointerActive = false;
    this.pointerActive = false;
    this.curX = -1;
    this.curY = -1;
    this.lastX = -1;
    this.lastY = -1;
    this.totalDeltaX = 0;
    this.totalDeltaY = 0;
  }

}
