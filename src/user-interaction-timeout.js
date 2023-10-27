class UserInteractionTimeout {

  constructor(el=document.body, millis=1000, completeCallback, interactedCallback) {
    // setup
    this.el = el;
    this.millis = millis;
    this.completeCallback = completeCallback;
    this.interactedCallback = interactedCallback;

    // add listeners all to a single callback
    this.events = ['mousedown', 'touchstart', 'mousemove', 'touchmove', 'mouseup', 'touchend', 'scroll'];
    this.events.forEach((eventName) => {
      this.el.addEventListener(eventName, (e) => this.interacted());
    });
  }

  interacted(e) {
    if(this.interactedCallback) this.interactedCallback();
    window.clearTimeout(this.timeout);
    this.timeout = window.setTimeout(() => {
      if(this.completeCallback) this.completeCallback();
    }, this.millis);
  }

}

export default UserInteractionTimeout;
