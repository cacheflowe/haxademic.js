import DemoBase from "./demo--base.es6.js";
import VideoToBlob from "../src/video-to-blob.es6.js";

class VideoDownloadDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "Video Download",
      "video-download-container",
      "Share a video file on mobile with the Share API. Needs user interaction and https to work."
    );
  }

  init() {
    // add video element
    this.videoEl = document.createElement("video");
    this.videoEl.src = "../data/wash-your-hands.mp4";
    this.videoEl.style.setProperty("width", "100%");
    this.videoEl.setAttribute("loop", "true");
    this.videoEl.setAttribute("muted", "true");
    this.videoEl.setAttribute("playsinline", "true");
    this.videoEl.setAttribute("autoplay", "true");
    this.videoEl.volume = 0;
    this.el.appendChild(this.videoEl);

    // add link
    this.linkEl = document.createElement("a");
    this.linkEl.innerText = "Download Video";
    this.linkEl.setAttribute("href", "../data/wash-your-hands.mp4");
    this.el.appendChild(this.linkEl);

    // load video to blob
    fetch(this.videoEl.src)
      .then((response) => {
        return response.blob();
      })
      .then((blob) => {
        var file = new File([blob], "wash-your-hands.mp4", {
          type: "video/mpeg",
        });
        var filesArray = [file];

        // click event to launch share api
        this.linkEl.addEventListener("click", (e) => {
          e.preventDefault();
          if (navigator.canShare && navigator.canShare({ files: filesArray })) {
            navigator.share({
              text: "video_file",
              files: filesArray,
              // title: "Your Video",
              // url: this.videoEl.src,
            });
          }
        });
      });
  }
}

if (window.autoInitDemo) window.demo = new VideoDownloadDemo(document.body);
