class MidiDevice {

  // code from:
  // https://webmidi-examples.glitch.me/
  // https://www.onlinemusictools.com/webmiditest/
  // Works in Chrome only!

  constructor(inputCallback, errorCallback) {
    this.inputCallback = inputCallback;
    this.errorCallback = errorCallback;
    this.initMidi();
  }

  initMidi() {
    if (!('requestMIDIAccess' in navigator)) {
      if(this.errorCallback) this.errorCallback('This browser doesn\'t support WebMIDI. Try Chrome for now.');
    } else {
      navigator.requestMIDIAccess().then((midi) => {
        this.parseMidiDevices(midi);
        midi.onstatechange = (e) => this.parseMidiDevices(e.target);
      });
    }
  }

  parseMidiDevices(midi) {
    // grab first MIDI device.
    // needs more code to support multiples
    this.midiInputs = midi.inputs.values().next().value;
    this.midiOutputs = midi.outputs.values().next().value;
    this.deviceInName = this.midiInputs.name;

    if (this.midiInputs) {
      // listen for midi input
      this.midiInputs.addEventListener('midimessage', (msg) => {
        // return data from MIDI message
        if(this.inputCallback) {
          this.inputCallback({
            cmd: msg.data[0] >> 4,
            pitch: msg.data[1],
            velocity: (msg.data.length > 2) ? msg.data[2] : 0,
          });
        }
      });
    }
  }
}

MidiDevice.NOTE_ON = 9;
MidiDevice.NOTE_OFF = 8;

export default MidiDevice;
