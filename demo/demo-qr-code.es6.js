import DemoBase from "./demo--base.es6.js";
import QRCode from "../vendor/qrcode_.min.js";

class QRCodeDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "QRCode",
      "qr-container",
      'Uses <a href="https://github.com/soldair/node-qrcode">qrcode.min.js</a> via the pre-built browser bundle. Our version has an added export for local import'
    );
  }

  async init() {
    let url = "https://cacheflowe.com/";

    // build <a> container
    let link = document.createElement("a");
    link.setAttribute("href", url);
    this.el.appendChild(link);

    // build canvas element
    let canvas = document.createElement("canvas");
    link.appendChild(canvas);

    // build QR code
    // set options...
    let options = {
      errorCorrectionLevel: "Q", // L, M, Q, H
      margin: 4,
      scale: 5, // pixels per square
      width: 256, // overides `scale`
      color: {
        dark: "#000000",
        light: "#ff2222",
      },
    };
    // reuse the canvas by passing in
    await QRCode.toCanvas(canvas, url, options);
  }
}

if (window.autoInitDemo) window.demo = new QRCodeDemo(document.body);
