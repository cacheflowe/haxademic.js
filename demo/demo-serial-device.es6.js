class SerialDeviceDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [
      "../src/serial-device.es6.js",
    ], 'SerialDevice', 'serial-container');
  }

  async init() {
    // setup
    this.serialContainer = document.getElementById('serial-container');
    this.startWithButton();
  }

  startWithButton() {
    // add button to start everything
    this.startButton = document.createElement('button');
    this.startButton.innerText = 'Start';
    this.serialContainer.appendChild(this.startButton);

    // click to init serial device selector
    this.startButton.addEventListener('click', (e) => {
      this.startButton.parentNode.removeChild(this.startButton);
      // init serial device on user interaction
      this.serialDevice = new SerialDevice(
        (data) => this.serialRead(data),
        (err) => this.serialError(err)
      );
    });
  }

  serialRead(data) {
    let val = data;
    if(data.length && data.length > 0 && data[0] == 'a') {
      this.serialContainer.innerHTML = `<p>Distance: ${data.substring(1)}mm</p>`;
    }
  }

  serialError(err) {
    this.serialContainer.innerHTML = `<p style="color:red;">Error: ${err}</p>`;
  }

}

if(window.autoInitDemo) window.demo = new SerialDeviceDemo(document.body);
