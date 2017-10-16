class AppStoreDebug {

  constructor() {
    this.showing = false;
    this.buildElement();
    _store.addStateable(this);
    this.initKeyListener();
  }

  initKeyListener() {
    window.addEventListener('keyup', (e) => {
      var key = e.keyCode ? e.keyCode : e.which;
      if(key == 191) {
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
    this.container.style.cssText = 'position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:9999;background:rgba(255,255,255,0.8);color:#000;';
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
