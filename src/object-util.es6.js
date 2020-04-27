class ObjectUtil {

  static deepCopy(obj) {
    let newObj = JSON.parse(JSON.stringify(obj));
    return newObj;
  }

}