import AppStoreDistributed from "../app-store-distributed.js";

// self-registering child components
import "./websocket-indicator.js";
import "./app-store-debug.js";

class AppStateDistributed extends HTMLElement {
  connectedCallback() {
    this.shadow = this.attachShadow({ mode: "open" });
    this.initSharedState();
    this.addChildren();
    // if (this.isDebug()) this.storeDebug.show();
  }

  initSharedState() {
    // connect to websocket server
    this.webSocketHost = "ws://" + document.location.hostname + ":3001/ws";
    this.appStore = new AppStoreDistributed(this.webSocketHost);

    // listen for data/events
    _store.addListener(this);
    _store.addListener(this, "AppStoreDistributed_CONNECTED"); // emitted by AppStoreDistributed when connected
  }

  isDebug() {
    return this.hasAttribute("debug");
  }

  addChildren() {
    this.shadow.innerHTML = this.isDebug()
      ? /*html*/ `
        <websocket-indicator></websocket-indicator>
        <app-store-debug></app-store-debug>
      `
      : /*html*/ `
        <app-store-debug></app-store-debug>
      `;
    this.storeDebug = this.shadow.querySelector("app-store-debug");
  }

  // AppStore listeners

  AppStoreDistributed_CONNECTED(val) {
    _store.set("TABLET_CONNECTED", true, true); // let desktop app know that we're here
  }

  storeUpdated(key, val) {}

  static register() {
    customElements.define("app-state-distributed", AppStateDistributed);
  }
}

AppStateDistributed.register();

export default AppStateDistributed;
