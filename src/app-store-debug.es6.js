class AppStoreDebug {
  constructor(showing = false) {
    this.showing = showing;
    this.buildElement();
    _store.addListener(this);
    this.initKeyListener();
  }

  initKeyListener() {
    window.addEventListener("keyup", (e) => {
      var key = e.keyCode ? e.keyCode : e.which;
      // console.log('key', key);
      if (key == 32) {
        this.showing = !this.showing;
      }
      if (this.showing == false) {
        this.container.innerHTML = "";
        this.container.style.display = "none";
      } else {
        this.printStore();
        this.container.style.display = "block";
      }
    });
  }

  buildElement() {
    this.container = document.createElement("div");
    this.container.style.cssText = `
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
    document.body.appendChild(this.container);
    if (!this.showing) this.container.style.display = "none";
  }

  storeUpdated(key, value) {
    if (this.showing) this.printStore();
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
    this.container.innerHTML = htmlStr;
  }
}

export default AppStoreDebug;
