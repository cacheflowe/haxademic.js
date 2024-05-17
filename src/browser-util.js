class BrowserUtil {
  // Fullscreen API

  static toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
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
