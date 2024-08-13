class MobileUtil {
  static isFullscreenApp() {
    return window.navigator.standalone;
  }

  static enablePseudoStyles() {
    document.addEventListener("touchstart", function () {}, false);
  }

  static setDeviceInputClass() {
    const deviceClass = MobileUtil.isMobileBrowser() ? "mobile" : "desktop";
    document.body.classList.add(deviceClass);
  }

  static lockTouchScreen(isLocked) {
    if (isLocked == false) {
      document.body.style.removeProperty("touch-action");
      document.body.style.removeProperty("overflow");
      document.ontouchmove = null;
    } else {
      document.body.style.setProperty("touch-action", "none");
      document.body.style.setProperty("overflow", "hidden");
      document.ontouchmove = function (e) {
        e.preventDefault();
      };
    }
  }

  static lockElement(isLocked) {
    if (isLocked == false) {
      document.ontouchmove = null;
      document.body.style.removeProperty("touch-action");
    } else {
      document.ontouchmove = function (e) {
        e.preventDefault();
      };
      document.body.style.setProperty("touch-action", "none");
    }
  }

  static disableTextSelect(el, isDisabled) {
    if (isDisabled == false) {
      el.style.removeProperty("user-select");
      el.style.removeProperty("-moz-user-select");
      el.style.removeProperty("-ms-user-select");
      el.style.removeProperty("-webkit-user-select");
      el.style.removeProperty("-webkit-touch-callout");
    } else {
      el.style.setProperty("user-select", "none");
      el.style.setProperty("-moz-user-select", "none");
      el.style.setProperty("-ms-user-select", "none");
      el.style.setProperty("-webkit-user-select", "none");
      el.style.setProperty("-webkit-touch-callout", "none");
    }
  }

  static disableZoom() {
    document.addEventListener(
      "touchmove",
      function (event) {
        event = event.originalEvent || event;
        if (event.scale != 1) {
          event.preventDefault();
        }
      },
      false
    );
  }

  static disableTrackpadZoom() {
    window.addEventListener("mousewheel", function (e) {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    });
  }

  static addFullscreenEl(el, usesVH = true, isBackground = false) {
    // use in conjunction with addFullscreenListener()
    // helps stick an element to fullscreen, no matter where mobile Safari's browser bars are
    if (usesVH) el.style.setProperty("height", "calc(var(--vh, 1vh) * 100)");
    else el.style.setProperty("height", "100%");
    el.style.setProperty("width", "100%");
    el.style.setProperty("position", "fixed");
    el.style.setProperty("top", "0");
    el.style.setProperty("left", "0");
    if (isBackground) el.style.setProperty("z-index", "-9999");
  }

  static addFullscreenListener(extraUpdateTimeout = 100) {
    if (MobileUtil.FULLSCREEN_LISTENING) return;
    MobileUtil.FULLSCREEN_LISTENING = true;
    // from: https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
    // look into `viewport-fit=cover` in the future. also: `min-height: -webkit-fill-available`
    window.addEventListener("resize", () => {
      MobileUtil.updateFullscreenHeight();
      // debounce it too, as iOS Firefox gets stuck
      // requestAnimationFrame didn't fix it on FF iOS, but setTimeout() did
      setTimeout(() => MobileUtil.updateFullscreenHeight(), extraUpdateTimeout);
    });
    window.dispatchEvent(new Event("resize"));
  }

  static updateFullscreenHeight() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  }

  static hideSoftKeyboard() {
    if (document.activeElement && document.activeElement.blur)
      document.activeElement.blur();
    var inputs = document.querySelectorAll("input");
    for (var i = 0; i < inputs.length; i++) inputs[i].blur();
  }

  static unlockWebAudioOnTouch() {
    window.addEventListener("touchstart", MobileUtil.playEmptyWebAudioSound);
  }

  static playEmptyWebAudioSound() {
    var myContext =
      AudioContext != null ? new AudioContext() : new webkitAudioContext(); // create empty buffer and play it
    var buffer = myContext.createBuffer(1, 1, 44100);
    var source = myContext.createBufferSource();
    source.buffer = buffer;
    source.connect(myContext.destination); // connect to output (your speakers)
    source.start(); // play the file
    window.removeEventListener("touchstart", MobileUtil.playEmptyWebAudioSound); // clean up the event listener
  }

  // PLATFORM DETECTION

  static isMobileBrowser() {
    var userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.match(/android|iphone|ipad|ipod/i)) return true;
    return false;
  }

  static isIOS() {
    var userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.match(/iphone/i)) return true;
    if (userAgent.match(/ipad/i)) return true;
    if (userAgent.match(/ipod/i)) return true;
    if (userAgent.match(/crios/i)) return true;
    return false;
  }

  static isIPhone() {
    var userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.match(/iphone/i)) return true;
    if (userAgent.match(/ipod/i)) return true;
    return false;
  }

  static isAndroid() {
    var userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.match(/android/i)) return true;
    return false;
  }

  static isSafari() {
    var userAgent = navigator.userAgent.toLowerCase();
    var isChrome = userAgent.match(/chrome/i) ? true : false;
    var isSafari = userAgent.match(/safari/i) ? true : false;
    return isSafari == true && isChrome == false ? true : false;
  }

  static isIE11() {
    return !!window.MSInputMethodContext && !!document.documentMode;
  }

  // MOBILE HELPERS

  static alertErrors() {
    // alert errors on mobile to help detect bugs
    if (!window.addEventListener) return;
    window.addEventListener("error", (e) => {
      var fileComponents = e.filename.split("/");
      var file = fileComponents[fileComponents.length - 1];
      var line = e.lineno;
      var message = e.message;
      alert("ERROR\n" + "Line " + line + " in " + file + "\n" + message);
    });
  }

  static openNewWindow(href) {
    // gets around native mobile popup blockers
    var link = document.createElement("a");
    link.setAttribute("href", href);
    link.setAttribute("target", "_blank");
    var clickevent = document.createEvent("Event");
    clickevent.initEvent("click", true, false);
    link.dispatchEvent(clickevent);
    return false;
  }

  static addDevPanel() {
    var script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/eruda";
    document.body.append(script);
    script.onload = function () {
      eruda.init();
    };
  }
}

MobileUtil.FULLSCREEN_LISTENING = false;

export const isMobileBrowser = MobileUtil.isMobileBrowser;
export default MobileUtil;
