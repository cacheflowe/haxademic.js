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
    // this.sendOnClick();
    this.initSlider();
    // EITHER init serial with button or auto-init with index
    // this.initSerialWithButton();
    this.initSerial(0);
  }

  initSerialWithButton() {
    // add button to start everything
    this.startButton = document.createElement("button");
    this.startButton.innerText = "Start";
    this.el.appendChild(this.startButton);

    // click to init serial device selector
    this.startButton.addEventListener("click", (e) => {
      this.startButton.parentNode.removeChild(this.startButton);
      this.initSerial();
    });
  }

  initSerial(autoInitIndex = null) {
    this.serialDevice = new SerialDevice(
      115200,
      (data) => this.serialRead(data),
      (err) => this.serialError(err),
      autoInitIndex
    );
  }

  sendOnClick() {
    document.addEventListener("click", (e) => {
      if (!!this.serialDevice && this.serialDevice.initialized) {
        this.serialDevice.writeString("n" + Math.round(Math.random() * 20));
      }
    });
  }

  initSlider() {
    // add slider to send data
    this.slider = document.createElement("input");
    this.slider.type = "range";
    this.slider.min = 0;
    this.slider.max = 30;
    this.slider.value = 0;
    this.el.appendChild(this.slider);

    // send data on slider change
    this.slider.addEventListener("input", (e) => {
      if (!!this.serialDevice && this.serialDevice.initialized) {
        this.serialDevice.writeString("n" + parseInt(this.slider.value));
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
        this.debugEl.innerHTML = `<p>Info: ${data}</p>`;
      }
    } else {
      this.debugEl.innerHTML = `<p>Info: ${data}</p>`;
    }
  }

  serialError(err) {
    this.el.innerHTML = `<p style="color:red;">Error: ${err}</p>`;
  }
}

if (window.autoInitDemo) window.demo = new SerialDeviceDemo(document.body);
