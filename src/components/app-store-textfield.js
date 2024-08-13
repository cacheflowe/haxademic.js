import AppStoreElement from "./app-store-element.js";

class AppStoreTextfield extends AppStoreElement {
  storeUpdated(key, value) {
    if (key == this.storeKey) {
      this.input.value = value;
    }
  }

  initStoreListener() {
    this.input = this.el.querySelector("input");
    this.input.addEventListener("input", (e) => {
      _store.set(this.storeKey, e.target.value, true);
    });
    this.input.value = _store.get(this.storeKey) || "";

    super.initStoreListener();
  }

  css() {
    return /*css*/ ``;
  }

  html() {
    return /*html*/ `
      <input type="text" placeholder="Text here" >
    `;
  }

  static register() {
    customElements.define("app-store-textfield", AppStoreTextfield);
  }
}

AppStoreTextfield.register();

export default AppStoreTextfield;
