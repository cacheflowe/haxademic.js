class ObjectPool {

  // An object pool that grows as needed.
  // Contract:
  // * Object has a public `isActive()` function
  // * Init by passing in Class definition: `new ObjectPool(GameSphere)`

  constructor(klass) {
    this.klass = klass;
    this.objects = [];
  }

  pool() {
    return this.objects;
  }

  getObject() {
    // try to find an inactive object
    let freeObject = this.objects.find((el) => {
      return el.isActive() == false;
    });
    if(freeObject) {
      return freeObject;
    } else {
      this.objects.push(new this.klass());
      return this.objects[this.objects.length - 1];
    }
  }

  anyActive() {
    return null != this.objects.find((el) => {
      return el.isActive() == true;
    });
  }

}

export default ObjectPool;
