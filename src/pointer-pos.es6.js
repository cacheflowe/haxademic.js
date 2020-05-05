class PointerPos {

  constructor(callbackMove, callbackStart, callbackEnd) {
    this.callbackMove = callbackMove;
    this.callbackStart = callbackStart;
    this.callbackEnd = callbackEnd;
    this.curX = -1;
    this.curY = -1;
    this.lastX = -1;
    this.lastY = -1;
    this.totalDeltaX = 0;
    this.totalDeltaY = 0;

    // add mouse/touch listeners
    document.addEventListener('mousedown', (e) => {
      this.pointerMoved(e.clientX, e.clientY, true);
      if(this.callbackStart) this.callbackStart();
    });
    document.addEventListener('mousemove', (e) => {
      this.pointerMoved(e.clientX, e.clientY);
    });
    document.addEventListener('mouseup', (e) => {
      if(this.callbackEnd) this.callbackEnd();
    });
    document.addEventListener('touchstart', (e) => {
      this.pointerMoved(e.touches[0].clientX, e.touches[0].clientY, true);
      if(this.callbackStart) this.callbackStart();
    });
    document.addEventListener('touchmove', (e) => {
      this.pointerMoved(e.touches[0].clientX, e.touches[0].clientY);
    });
    document.addEventListener('touchend', (e) => {
      if(this.callbackEnd) this.callbackEnd();
    });
  }

  reset() {
    this.curX = -1;
    this.curY = -1;
    this.lastX = -1;
    this.lastY = -1;
  }

  pointerMoved(x, y, started=false) {
    if(started) {
      this.curX = x;
      this.curY = y;
    }
    this.lastX = this.curX;
    this.lastY = this.curY;
    this.curX = x;
    this.curY = y;
    let deltaX = this.curX - this.lastX;
    let deltaY = this.curY - this.lastY;
    this.totalDeltaX += Math.abs(deltaX);
    this.totalDeltaY += Math.abs(deltaY);
    if(this.callbackMove) this.callbackMove(this.curX, this.curY, deltaX, deltaY);
  }

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

  xPercent(el) {
    if(el) {
      var offset = el.getBoundingClientRect();
      var relativeX = this.curX - offset.left;
      return relativeX / offset.width;
    }
    return this.curX / window.innerWidth;
  };

  yPercent(el) {
    if(el) {
      var offset = el.getBoundingClientRect();
      var relativeY = this.curY - offset.top;
      return relativeY / offset.height;
    }
    return this.curY / window.innerHeight;
  };

  xDelta() {
    return (this.lastX == -1) ? 0 : this.curX - this.lastX;
  };

  yDelta() {
    return (this.lastY == -1) ? 0 : this.curY - this.lastY;
  };

  xDeltaTotal() {
    return this.totalDeltaX;
  };

  yDeltaTotal() {
    return this.totalDeltaY;
  };

}
