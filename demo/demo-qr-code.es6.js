import DemoBase from "./demo--base.es6.js";

class QRCodeDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      ["!../vendor/qrcode.min.js"],
      "QRCode",
      "qr-container",
      "Uses qrcode.min.js"
    );
  }

  init() {
    var qrcode = new QRCode("qr-container", {
      text: "https://cacheflowe.com/",
      width: 128,
      height: 128,
      colorDark: "#000000",
      colorLight: "#ffffff",
      // correctLevel : QRCode.CorrectLevel.H
    });
  }
}

if (window.autoInitDemo) window.demo = new QRCodeDemo(document.body);
