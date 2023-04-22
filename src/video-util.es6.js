class VideoUtil {
  // factory helpers

  static buildVideoEl(videoPath, muted = true) {
    let videoEl = document.createElement("video");
    videoEl.setAttribute("preload", "auto");
    videoEl.setAttribute("playsinline", "true");
    videoEl.setAttribute("crossOrigin", "anonymous");
    videoEl.setAttribute("loop", "true");
    videoEl.setAttribute("src", videoPath);
    videoEl.setAttribute("autoplay", "true");
    if (muted) {
      videoEl.setAttribute("muted", "true");
      videoEl.volume = 0;
      videoEl.defaultMuted = true;
      videoEl.muted = true;
    }
    return videoEl;
  }

  // listener helpers/examples
  // https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement

  static addCompleteListener(videoEl, callback) {
    videoEl.addEventListener("ended", callback);
  }

  static removeCompleteListener(videoEl, callback) {
    videoEl.removeEventListener("ended", callback);
  }

  // getters

  static curTime(videoEl) {
    return !VideoUtil.durationValid(videoEl) ? 0 : videoEl.currentTime;
  }

  static curTimeNorm(videoEl) {
    return !VideoUtil.durationValid(videoEl)
      ? 0
      : videoEl.currentTime / videoEl.duration;
  }

  static duration(videoEl) {
    return !VideoUtil.durationValid(videoEl) ? -1 : videoEl.duration;
  }

  static durationValid(videoEl) {
    return videoEl && videoEl.duration > 1;
  }

  // setters

  static setMuted(videoEl, muted) {
    videoEl.defaultMuted = muted;
    videoEl.muted = muted;
  }

  static setTime(videoEl, time) {
    videoEl.currentTime = time;
  }

  static setTimeNorm(videoEl, timeNorm) {
    if (!VideoUtil.durationValid(videoEl)) {
      console.warn("VideoUtil.setTimeNorm() failed - no duration");
      return;
    }
    videoEl.currentTime = timeNorm * videoEl.duration;
  }

  static setRate(videoEl, rate = 1) {
    videoEl.playbackRate = rate;
  }

  static setLoop(videoEl, loops = true) {
    videoEl.loop = loops;
    videoEl.removeAttribute("loop");
  }
}

export default VideoUtil;
