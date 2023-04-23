class AppStoreDebug {
  constructor(showing = false) {
    this.showing = showing;
    this.buildElement();
    _store.addListener(this);
    this.initKeyListener();
  }

  initKeyListener() {
    window.addEventListener("keyup", (e) => {
      if (e.key == "/") {
        this.showing = !this.showing;
      }
      if (this.showing == false) {
        this.hide();
      } else {
        this.show();
      }
    });
  }

  buildElement() {
    this.el = document.createElement("div");
    this.el.style.cssText = `
      font-family: arial;
      font-size: 12px;
      position: fixed;
      top: 0;
      left: 0;
      padding: 12px;
      height: 100%;
      overflow-y: auto;
      opacity: 0.9;
      z-index: 9999;
      background: rgba(0,0,0,0.8);
      color: #fff !important;
    `;
    document.body.appendChild(this.el);
    if (!this.showing) this.hide();
  }

  storeUpdated(key, value) {
    if (this.showing) this.printStore();
  }

  show() {
    this.printStore();
    this.el.style.display = "block";
  }

  hide() {
    this.el.innerHTML = "";
    this.el.style.display = "none";
  }

  printStore() {
    let htmlStr = "<table>";
    for (let storeKey in _store.state) {
      let val = _store.state[storeKey];
      if (val && typeof val == "object" && val.length && val.length > 0)
        val = `Array(${val.length})`; // special display for arrays
      htmlStr += `<tr><td>${storeKey}</td><td>${val}</td></tr>`;
    }
    htmlStr += "</table>";
    this.el.innerHTML = htmlStr;
  }
}

export default AppStoreDebug;
