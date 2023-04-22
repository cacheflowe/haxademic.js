class WheelUtil {
  constructor() {}

  static addWheelListener(callback, el = document, preventDefault = false) {
    el.addEventListener(
      "wheel",
      (e) => {
        if (preventDefault) {
          e.preventDefault();
          e.stopPropagation();
        }
        callback(e.deltaX, e.deltaY, e);
      },
      { capture: false, passive: !preventDefault }
    ); // if we want to cancel, it can't be passive
  }
}

export default WheelUtil;
