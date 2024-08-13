import MobileUtil from "../mobile-util.js";
import AppStoreElement from "./app-store-element.js";

class AppStoreButton extends AppStoreElement {
  storeUpdated(key, value) {
    if (key != this.storeKey) return;
    // disable button if clicked
    if (value == this.storeValue) this.button.setAttribute("disabled", true);
    else this.button.removeAttribute("disabled");
  }

  clickEvent() {
    return MobileUtil.isMobileBrowser() ? "touchstart" : "click";
  }

  initStoreListener() {
    this.button = this.el.querySelector("button");
    this.button.addEventListener(this.clickEvent(), (e) => {
      if (!this.storeKey) return;
      // if the storeValue is "true" or "false", send the boolean instead of the string
      const value =
        this.storeValue == "true"
          ? true
          : this.storeValue == "false"
          ? false
          : this.storeValue;
      _store.set(this.storeKey, value, true);
    });

    super.initStoreListener();
  }

  css() {
    return /*css*/ `
    `;
  }

  html() {
    return /*html*/ `
      <button>
        ${this.initialHTML}
      </button>
    `;
  }

  static register() {
    customElements.define("app-store-button", AppStoreButton);
  }
}

AppStoreButton.register();

export default AppStoreButton;
