class EventLog {

  constructor(debugEl=null, maxItems=20) {
    this.debugEl = debugEl;
    this.maxItems = maxItems;
  }

  log(message, color=null) {
    // add to the log
    if(message) {
      let styleAttr = (color) ? `style="background-color:${color}"` : "";
      this.debugEl.innerHTML += `<div ${styleAttr}>${message.toString()}</div>`;
    }
    // truncate log
    while(this.debugEl.childNodes.length > this.maxItems) {
      var el = this.debugEl.childNodes[0];
      el.parentNode.removeChild(el);
    }
  }
}

export default EventLog;
