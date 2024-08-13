import EventLog from "../event-log.js";

class EventLogView extends HTMLElement {
  connectedCallback() {
    // this.shadow = this.attachShadow({ mode: "open" });
    this.el = this.shadow ? this.shadow : this;
    this.render();
    _store.addListener(this);
    this.eventLog = new EventLog(this.el, 10); // use <div> instead of this.shadow so we can keep <style> intact
  }

  storeUpdated(key, value) {
    this.eventLog.log(`<pre>[${Date.now()}] ${key}: ${value}</pre>`);
  }

  html() {
    return /*html*/ `
      <h3><pre>AppStore Event Log</pre></h3>
      <div></div>
    `;
  }

  css() {
    return /*css*/ `
      :host {
        box-shadow: 0 0 20px 0 rgba(0,0,0,0.5);
        background: rgba(0,0,0,0.5);
        display: block;
        padding: 0.5rem 2rem;
      }
    `;
  }

  render() {
    this.el.innerHTML = /*html*/ `
      ${this.html()}
      <style>
        ${this.css()}
      </style>
    `;
  }

  static register() {
    customElements.define("event-log-view", EventLogView);
  }
}

EventLogView.register();

export default EventLogView;
