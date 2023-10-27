class PointerUtil {
  static multipleClickHandler(
    el,
    callback = null,
    numClicks = 5,
    tapEvent = "touchstart"
  ) {
    var clickStream = [];
    var clickWindow = numClicks * 300;
    el.addEventListener(tapEvent, function (e) {
      clickStream.push(Date.now());
      while (clickStream.length > numClicks) clickStream.shift();
      let recentClicks = clickStream.filter((time) => {
        return time > Date.now() - clickWindow;
      }).length;
      if (recentClicks >= numClicks) {
        clickStream.splice(0);
        if (callback) callback();
      }
    });
  }

  static getElementAtPoint(x, y) {
    return document.elementFromPoint(x, y);
  }

  static clickDocumentAtPoint(x, y) {
    let el = document.elementFromPoint(x, y);
    if (el && el.click) el.click();
    return el;
  }

  static dispatchPointerEvent(el, eventType) {
    const event = document.createEvent("UIEvent");
    event.initUIEvent(eventType, true, true, window, 0);
    let touches = [{ target: el }];
    if (!!eventType.match(/touch/)) {
      Object.defineProperties(event, {
        changedTouches: { value: touches },
      });
    }
    el.dispatchEvent(event);
  }

  static clickElement(el) {
    const clickEvent = new MouseEvent("click");
    el.dispatchEvent(clickEvent);
  }

  static disableRightClick(el) {
    el.oncontextmenu = function (e) {
      return false;
    };
  }
}

export default PointerUtil;
