class PointerUtil {

  // TODO: finish converting this !
  static multipleClickHandler(el) {
    // require quintuple-click
    var clickStream = [];
    var numClicks = 5;
    var timeWindow = 3000;
    el.addEventListener(window.tapEvent, function(e){
      clickStream.push(Date.now());
      while(clickStream.length > numClicks) clickStream.shift();
      var recentClicks = clickStream.filter(function(clickTime) {
        return clickTime > Date.now() - timeWindow;
      });
      if(recentClicks.length < numClicks) e.preventDefault();
      else clickStream.splice(0);
    });
  }

  static getElementAtPoint(x, y) {
    return document.elementFromPoint(x, y);
  }

  static clickDocumentAtPoint(x, y) {
    let el = document.elementFromPoint(x, y);
    if(el && el.click) el.click();
    return el;
  }

  static dispatchPointerEvent(el, eventType) {
    const event = document.createEvent('UIEvent');    
    event.initUIEvent(eventType, true, true, window, 0);
    let touches = [{target: el}];
    if(!!eventType.match(/touch/)) {
      Object.defineProperties(event, {
        changedTouches: {value: touches}
      });    
    }
    el.dispatchEvent(event);
  }

  static clickElement(el) {
    const clickEvent = new MouseEvent("click");
    el.dispatchEvent(clickEvent);
  }

  static disableRightClick(el) {
    el.oncontextmenu = function(e){ return false; };
  }

}
