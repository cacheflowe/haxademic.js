class ObjectUtil {
  static deepCopy(obj) {
    let newObj = JSON.parse(JSON.stringify(obj));
    return newObj;
  }

  /*
  Helpful for lazy loading .js libraries and being notified when they're available.
  This only works once! Need to update this if we want multiple listeners
  Example:
  ```
    this.addPropertyChangedCallback(window, 'THREE', () => {
      this.initThreeScene();
    });
  ```
  */
  static addPropertyChangedCallback(obj, prop, callback) {
    if (obj[prop]) callback(obj[prop]); // if value already exists, do callback immediately
    let val = obj[prop]; // cache value & create listener for changes
    Object.defineProperty(obj, prop, {
      get() {
        return val;
      }, // return the cached value
      set(newVal) {
        val = newVal;
        callback(val);
      },
    });
  }

  static callbackWhenPropertyExists(obj, prop, callback) {
    if (obj[prop]) callback(obj[prop]);
    else {
      let interval = setInterval(() => {
        if (obj[prop]) {
          clearInterval(interval);
          callback(obj[prop]);
        }
      }, 100);
    }
  }

  static addProperties(obj, props) {
    for (let key in props) {
      obj[key] = props[key];
    }
  }

  static overrideOptionsObject(defaultOptions, customOptions) {
    for (let key in customOptions) {
      if (defaultOptions[key]) defaultOptions[key] = customOptions[key];
    }
  }
}

export default ObjectUtil;
