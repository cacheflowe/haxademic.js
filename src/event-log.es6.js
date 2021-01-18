class EventLog {

  constructor(debugEl=null, maxItems=20) {
    this.debugEl = debugEl;
    this.maxItems = maxItems;
  }

  log(message) {
    // add to the log
    if(message) this.debugEl.innerHTML += `<div>${message.toString()}</div>`;
    // truncate log
    while(this.debugEl.childNodes.length > this.maxItems) {
      var el = this.debugEl.childNodes[0];
      el.parentNode.removeChild(el);
    }
  }
}

export default EventLog;
