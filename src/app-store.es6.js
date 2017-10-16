class AppStore {

  constructor() {
    this.state = {};
    this.stateables = [];
    window._store = this;
  }

  addStateable(obj) {
    this.stateables.push(obj);
  }

  removeStateable(obj) {
    const index = this.stateables.indexOf(obj);
    if (index !== -1) this.stateables.splice(index, 1);
  }

  set(key, value) {
    if(typeof key === "undefined") throw new Error('AppStore requires legit keys');
    this.state[key] = value;
    this.stateables.forEach((el, i, arr) => {
      el.storeUpdated(key, value);
    });
  }

  get(key) {
    return this.state[key];
  }

  log() {
    for(let key in _store.state) {
      console.log(key, _store.state[key]);
    }
  }

}
