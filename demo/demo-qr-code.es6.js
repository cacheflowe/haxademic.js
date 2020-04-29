class QRCodeDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [
      "../vendor/qrcode.min.js",
    ], 'QRCode', 'qr-container');
  }

  init() {
    var qrcode = new QRCode("qr-container", {
      text: "https://cacheflowe.com/",
      width: 128,
      height: 128,
      colorDark : "#000000",
      colorLight : "#ffffff",
      // correctLevel : QRCode.CorrectLevel.H
    });
  }

}

if(window.autoInitDemo) new QRCodeDemo(document.body);
