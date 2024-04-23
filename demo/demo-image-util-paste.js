import DemoBase from "./demo--base.js";
import ImageUtil from "../src/image-util.js";

class ImageUtilPasteDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "ImageUtil | Paste",
      "image-util-paste-container",
      "Paste an image into a website"
    );
  }

  init() {
    ImageUtil.pasteImageCallback((image) => {
      const img = document.createElement("img");
      img.src = image.src;
      this.el.append(img);
    });
  }
}

if (window.autoInitDemo) window.demo = new ImageUtilPasteDemo(document.body);
