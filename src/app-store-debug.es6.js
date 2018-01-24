class AppStoreDebug {

  constructor() {
    this.showing = false;
    this.buildElement();
    _store.addListener(this);
    this.initKeyListener();
  }

  initKeyListener() {
    window.addEventListener('keyup', (e) => {
      var key = e.keyCode ? e.keyCode : e.which;
      if(key == 32) {
        this.showing = !this.showing;
      }
      if(this.showing == false) {
        this.container.innerHTML = '';
      } else {
        this.printStore();
      }
    });
  }

  buildElement() {
    this.container = document.createElement( 'div' );
    this.container.style.cssText = 'position:fixed;top:0;left:0;height:100%;overflow-y:scroll;opacity:0.9;z-index:9999;background:rgba(255,255,255,0.8);color:#000 !important;';
    document.body.appendChild(this.container);
  }

  storeUpdated(key, value) {
    if(this.showing) this.printStore();
  }

  printStore() {
    let htmlStr = '<table>';
    for(let storeKey in _store.state) {
      let val = _store.state[storeKey];
      // console.log(typeof val);
      if(typeof val == "object" && val.length > 0) val = `Array(${val.length})`;
      htmlStr += `<tr><td>${storeKey}</td><td>${val}</td></tr>`;
    }
    htmlStr += '</table>';
    this.container.innerHTML = htmlStr;
  }

}
