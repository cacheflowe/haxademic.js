class MidiDeviceDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [
      "../src/midi-device.es6.js",
    ], 'MidiDevice', 'midi-container');
  }

  async init() {
    // setup
    this.midiContainer = document.getElementById('midi-container');
    this.startWithButton();
  }

  startWithButton() {
    // add button to start everything
    this.startButton = document.createElement('button');
    this.startButton.innerText = 'Start';
    this.midiContainer.appendChild(this.startButton);

    // click to init serial device selector
    this.startButton.addEventListener('click', (e) => {
      this.startButton.parentNode.removeChild(this.startButton);
      // init serial device on user interaction
      this.serialDevice = new MidiDevice(
        (data) => this.midiInputMessage(data),
        (err) => this.midiError(err)
      );
    });
  }

  midiInputMessage(msg) {
    this.midiContainer.innerHTML = `
      <p>cmd: ${msg.cmd == MidiDevice.NOTE_ON ? 'NOTE_ON' : 'NOTE_OFF'}</p>
      <p>pitch: ${msg.pitch}</p>
      <p>velocity: ${msg.velocity}</p>
    `;
  }

  midiError(err) {
    this.midiContainer.innerHTML = `<p style="color:red;">Error: ${err}</p>`;
  }

}

if(window.autoInitDemo) window.demo = new MidiDeviceDemo(document.body);
