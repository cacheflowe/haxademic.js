class AppStore {
  static LOCALSTORAGE_KEY = "_store";

  constructor() {
    this.state = {};
    this.listeners = [];
    this.methods = {};
    window._store = this;
  }

  addListener(obj, key) {
    if (key) {
      if (!this.methods[key]) this.methods[key] = [];
      this.methods[key].push(obj);
    } else {
      this.listeners.push(obj);
    }
  }

  removeListener(obj, key) {
    if (key) {
      if (this.methods[key]) {
        const index = this.methods[key].indexOf(obj);
        if (index !== -1) this.methods[key].splice(index, 1);
      }
    } else {
      const index = this.listeners.indexOf(obj);
      if (index !== -1) this.listeners.splice(index, 1);
    }
  }

  set(key, value) {
    if (typeof key === "undefined")
      throw new Error("AppStore requires legit keys");
    this.state[key] = value;
    this.listeners.forEach((el, i, arr) => {
      el.storeUpdated(key, value);
    });
    // specific listener methods
    const objs = this.methods[key];
    if (objs) {
      objs.forEach((el) => {
        if (el[key]) el[key](value);
        else throw new Error("AppStore listener has no callback: " + key);
      });
    }
    // save to local storage
    if (this.persistData) this.saveToLocalStorage(key);
  }

  get(key) {
    return this.state[key];
  }

  toString() {
    return JSON.stringify(this.state, null, 2);
  }

  log() {
    for (let key in _store.state) {
      console.log(key, _store.state[key]);
    }
  }

  initLocalStorage(keyTriggerExclusions = []) {
    this.persistData = true;
    this.keyTriggerExclusions = keyTriggerExclusions; // these keys will not trigger a save to localStorage
    const savedState = window.localStorage.getItem(AppStore.LOCALSTORAGE_KEY);
    if (savedState) {
      this.state = JSON.parse(savedState);
    }
  }

  saveToLocalStorage(key) {
    if (this.keyTriggerExclusions.includes(key)) return;
    let storeData = JSON.stringify(this.state);
    window.localStorage.setItem(AppStore.LOCALSTORAGE_KEY, storeData);
  }

  clearLocalStorage() {
    window.localStorage.removeItem(AppStore.LOCALSTORAGE_KEY);
  }
}

export default AppStore;
