import DemoBase from "./demo--base.js";
import SerialDevice from "../src/serial-device.js";

class SerialDeviceDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "SerialDevice",
      "serial-container",
      "Shows how to communicate with an Arduino or other serial device."
    );
  }

  async init() {
    this.initSerialWithButton();
    this.sendOnClick();
  }

  initSerialWithButton() {
    // add button to start everything
    this.startButton = document.createElement("button");
    this.startButton.innerText = "Start";
    this.el.appendChild(this.startButton);

    // click to init serial device selector
    this.startButton.addEventListener("click", (e) => {
      this.startButton.parentNode.removeChild(this.startButton);
      // init serial device on user interaction
      this.serialDevice = new SerialDevice(
        115200,
        (data) => this.serialRead(data),
        (err) => this.serialError(err)
      );
    });
  }

  sendOnClick() {
    document.addEventListener("click", (e) => {
      if (!!this.serialDevice && this.serialDevice.initialized) {
        // test write method
        // this.serialDevice.writeDataArray([Math.round(Math.random() * 100)]);
        this.serialDevice.writeString(
          "a" + Math.round(100 + Math.random() * 300)
        );
      }
    });
  }

  serialRead(data) {
    if (data.length && data.length > 0) {
      if (data[0] == "a") {
        this.el.innerHTML = `<p>Distance: ${data.substring(1)}mm</p>`;
      } else if (parseInt(data) > 40) {
        this.el.innerHTML = `<p>Distance: ${data}mm</p>`;
      } else {
        this.debugEl.innerHTML = `<p>Error: ${data}</p>`;
      }
    } else {
      this.debugEl.innerHTML = `<p>Error: ${data}</p>`;
    }
  }

  serialError(err) {
    this.el.innerHTML = `<p style="color:red;">Error: ${err}</p>`;
  }
}

if (window.autoInitDemo) window.demo = new SerialDeviceDemo(document.body);
