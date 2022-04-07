import DemoBase from './demo--base.es6.js';
import MidiDevice from '../src/midi-device.es6.js';

class MidiDeviceDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [], 'MidiDevice', 'midi-container');
  }

  async init() {
    // setup
    this.midiContainer = document.getElementById('midi-container');
    this.startWithButton();
    this.initMidi();
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
      this.initMidi();
    });
  }

  initMidi() {
    // build midi hardware interface
    this.midiDevice = new MidiDevice(
      (data) => this.midiInputMessage(data),
      (err) => this.midiError(err)
    );

    // build knobs
    this.knobs = {
      knob13: 0,
      knob14: 0,
      knob15: 0,
      knob16: 0,
    };
  }

  midiInputMessage(msg) {
    // update knobs object
    this.knobs[`knob${msg.pitch}`] = msg.velocityNorm;

    // log all values to screen
    let logStr = '<h3>Midi Input</h3>';
    for (let k in this.knobs) {
      logStr += `${k}: ${this.knobs[k]}<br>`;
    }
    this.debugEl.innerHTML = logStr;

    // log output
    this.midiContainer.innerHTML = `
      <p>cmd: ${msg.cmd}</p>
      <p>pitch: ${msg.pitch}</p>
      <p>velocity: ${msg.velocity}</p>
      <p>velocityNorm: ${msg.velocityNorm}</p>
    `;

  }

  midiError(err) {
    this.midiContainer.innerHTML = `<p style="color:red;">Error: ${err}</p>`;
  }

}

if(window.autoInitDemo) window.demo = new MidiDeviceDemo(document.body);
