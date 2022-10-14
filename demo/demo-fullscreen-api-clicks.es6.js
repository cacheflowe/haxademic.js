import DemoBase from "./demo--base.es6.js";

class FullScreenClicksAPIDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "Fullscreen API | Clicks",
      "fullscreen-api-demo-clicks",
      "Tap corner button 5 times to toggle fullscreen."
    );
  }

  init() {
    // create secret button
    const secretButton = document.createElement("div");
    secretButton.setAttribute(
      "style",
      "position: fixed; top: 0; right: 0; width: 100px; height: 100px; background: #f00; opacity: 0.2"
    );
    this.el.appendChild(secretButton);

    // add multiple click handler
    this.multipleClickHandler(
      secretButton,
      this.toggleFullScreen,
      5,
      "mouseup"
    );
  }

  multipleClickHandler(
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

  toggleFullScreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }
}

if (window.autoInitDemo)
  window.demo = new FullScreenClicksAPIDemo(document.body);
