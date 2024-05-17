class BrowserUtil {
  // Fullscreen API

  static isFullscreen() {
    return !!document.fullscreenElement;
  }

  static toggleFullscreen() {
    if (!BrowserUtil.isFullscreen()) {
      BrowserUtil.enterFullscreen();
    } else {
      BrowserUtil.exitFullscreen();
    }
  }

  static enterFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    }
  }

  static exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }

  // Wake Lock API
  // info: https://developer.chrome.com/docs/capabilities/web-apis/wake-lock

  static isWakeLocked() {
    return !!BrowserUtil.wakeLock;
  }

  static toggleWakeLock() {
    if (!BrowserUtil.isWakeLocked()) {
      BrowserUtil.enableWakeLock();
    } else {
      BrowserUtil.disableWakeLock();
    }
  }

  static async enableWakeLock() {
    try {
      BrowserUtil.disableWakeLock();
      BrowserUtil.wakeLock = await navigator.wakeLock.request();
      BrowserUtil.wakeLock.addEventListener("release", () => {
        console.log(
          "Screen Wake Lock released:",
          BrowserUtil.wakeLock.released
        );
      });
      console.log("Screen Wake Lock released:", BrowserUtil.wakeLock.released);
    } catch (err) {
      console.error(`${err.name}, ${err.message}`);
    }
  }

  static disableWakeLock() {
    if (BrowserUtil.wakeLock) {
      BrowserUtil.wakeLock.release();
      BrowserUtil.wakeLock = null;
    }
  }
}

export default BrowserUtil;
