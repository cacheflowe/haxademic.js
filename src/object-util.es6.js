class ObjectUtil {

  static deepCopy(obj) {
    let newObj = JSON.parse(JSON.stringify(obj));
    return newObj;
  }

  static addPropertyChangedCallback(obj, prop, callback) {
    if (obj[prop]) {
      callback();
    } else {
      Object.defineProperty(obj, prop, {
        set: function(val) {
          callback();
        }
      });
    }
  }

}
