class ObjectUtil {

  static deepCopy(obj) {
    let newObj = JSON.parse(JSON.stringify(obj));
    return newObj;
  }

  static addPropertyChangedCallback(obj, prop, callback) {
    if (obj[prop]) callback(obj[prop]);   // if value already exists, do callback immediately
    let val = obj[prop];                  // cache value & create listener for changes
    Object.defineProperty(obj, prop, {
      get() { return val; }, // return the cached value
      set(newVal) {
        val = newVal;
        callback(val);
      }
    });
  }

  static overrideOptionsObject(defaultOptions, customOptions) {
    for(let key in customOptions) {
      if(defaultOptions[key]) defaultOptions[key] = customOptions[key]
    }
  }

}

export default ObjectUtil;
