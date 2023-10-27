import DemoBase from "./demo--base.js";
import MobileUtil from "../src/mobile-util.js";
import VideoUtil from "../src/video-util.js";

class VideoDownloadDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "Video Download",
      "video-download-container",
      "Save a video file directly to the camera roll on iOS via the Web Share API. Needs user interaction and https to work! Android and desktop browsers properly respect the <code>download</code> attribute and don't need the Web Share API."
    );
  }

  init() {
    this.initVideo();
    setTimeout(() => {
      this.initImage();
    }, 1000);
  }

  initVideo() {
    // add video element
    let videoPath = "../data/videos/wash-your-hands.mp4";
    this.videoEl = VideoUtil.buildVideoEl(videoPath, true);
    this.videoEl.style.setProperty("width", "320px");
    this.el.appendChild(this.videoEl);
    this.el.appendChild(document.createElement("br"));

    // add link
    let linkEl = document.createElement("a");
    linkEl.innerText = "Download Video";
    linkEl.setAttribute("href", videoPath);
    linkEl.setAttribute("download", "wash-your-hands.mp4");
    this.el.appendChild(linkEl);
    this.el.appendChild(document.createElement("br"));
    this.el.appendChild(document.createElement("br"));

    linkEl.addEventListener("click", (e) => {
      if (MobileUtil.isIOS()) {
        e.preventDefault();
        this.shareFile(videoPath, "video/mpeg", "wash-your-hands.mp4");
      } else {
        // do nothing - use default browser behavior
      }
    });
  }

  initImage() {
    // add video element
    let imagePath = "../data/images/bb.jpg";
    this.imageEl = document.createElement("img");
    this.imageEl.setAttribute("src", imagePath);
    this.imageEl.style.setProperty("width", "320px");
    this.el.appendChild(this.imageEl);
    this.el.appendChild(document.createElement("br"));

    // add link
    let linkEl = document.createElement("a");
    linkEl.innerText = "Download image";
    linkEl.setAttribute("href", imagePath);
    linkEl.setAttribute("download", "bb.jpg");
    linkEl.style.setProperty("display", "block");

    this.el.appendChild(linkEl);

    if (MobileUtil.isIOS()) {
      linkEl.innerText =
        "Tap & Hold Image to Save - it's the only way to get an image to the iOS photo roll";
    }

    linkEl.addEventListener("click", (e) => {
      if (MobileUtil.isIOS()) {
        e.preventDefault();
        // maybe someday this will work:
        // this.shareFile(imagePath, "image/jpeg", "bb.jpg");
      } else {
        // do nothing - use default browser behavior
      }
    });
  }

  // if (
  //   navigator.canShare &&
  //   navigator.canShare({ files: filesArray })
  // ) {

  async shareFile(filePath, type = "image/jpeg", saveFile = "download.jpg") {
    const response = await fetch(filePath);
    const blob = await response.blob();
    const filesArray = [
      new File([blob.slice()], saveFile, {
        type: type,
        // lastModified: new Date().getTime(), // doesn't work. video file will get saved with an old date in the photo roll
      }),
    ];
    const shareData = {
      files: filesArray,
    };
    navigator.share(shareData);
  }
}

if (window.autoInitDemo) window.demo = new VideoDownloadDemo(document.body);
