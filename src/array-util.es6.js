class ArrayUtil {

  static remove(array, element) {
    const index = array.indexOf(element);
    if (index !== -1) array.splice(index, 1);
  }

  static shuffleArray(array) {
    array.sort(() => {return 0.5 - Math.random()});
  }

  static randomElementFromArr(array) {
    return array[MathUtil.randRange(0, array.length - 1)];
  }

  static uniqueArray(array) {
    return array.filter((el, i, arr) => {
      return arr.indexOf(el) === i;   // only return the first instance of an element
    });
  }

}
