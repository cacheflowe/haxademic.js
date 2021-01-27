class WheelUtil {

  constructor() {}

  static addWheelListener(callback, el=document, preventDefault=false) {
    el.addEventListener('wheel', (e) => {
      if(preventDefault) {
        e.preventDefault();
        e.stopPropagation();
      }
      // delta remapping from: https://stackoverflow.com/a/49095733
      var delta = 0;
      if (!!e.wheelDelta) {   // CHROME WIN/MAC | SAFARI 7 MAC | OPERA WIN/MAC | EDGE
          delta = -e.wheelDelta / 120; 
      }
      if(!!e.deltaY) {        // FIREFOX WIN / MAC | IE
          e.deltaY > 0 ? delta = 1 : delta = -1;
      }
      callback(delta, e);
    }, {capture: false, passive: !preventDefault})  // if we want to cancel, it can't be passive
  }

}

export default WheelUtil;
