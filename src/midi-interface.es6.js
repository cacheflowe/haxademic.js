class MidiInterface {
  // code from:
  // https://webmidi-examples.glitch.me/
  // https://www.onlinemusictools.com/webmiditest/

  constructor(initCallback, inputCallback, errorCallback) {
    this.initCallback = initCallback;
    this.inputCallback = inputCallback;
    this.errorCallback = errorCallback;
    this.initMidi();
    this.midiInputState = {};
  }

  initMidi() {
    if (!("requestMIDIAccess" in navigator)) {
      if (this.errorCallback)
        this.errorCallback(
          "This browser doesn't support WebMIDI. Try Chrome for now."
        );
    } else {
      navigator.requestMIDIAccess().then((midi) => {
        this.midi = midi;
        this.parseMidiInterfaces(midi);
        this.initCallback(this.inputDeviceNames, this.outputDeviceNames);
        // midi.onstatechange = (e) => this.parseMidiInterfaces(e.target);
      });
    }
  }

  // collect device names and midi objects

  parseMidiInterfaces(midi) {
    this.inputDevices = Array.from(midi.inputs).map((el) => el[1]);
    this.outputDevices = Array.from(midi.outputs).map((el) => el[1]);
    this.inputDeviceNames = this.inputDevices.map((el) => el.name);
    this.outputDeviceNames = this.outputDevices.map((el) => el.name);
  }

  // midi input listening/handling

  listenToAllDevices() {
    this.inputDeviceNames.forEach((deviceName) =>
      this.listenToDevice(deviceName)
    );
  }

  listenToDevice(deviceName) {
    // try to find device by name
    let device = this.getDeviceByName(deviceName, this.inputDevices);
    // listen for midi input
    device?.addEventListener("midimessage", (msg) =>
      this.handleMidiInputMessage(msg)
    );
    return device;
  }

  handleMidiInputMessage(msg) {
    // return data from MIDI message
    let device = msg.target;
    let deviceName = msg.target.name;
    let cmd = msg.data[0] >> 4;
    let pitch = msg.data[1];
    let velocity = msg.data.length > 2 ? msg.data[2] : 0;
    let velocityNorm = velocity / 127;

    if (this.inputCallback) {
      this.inputCallback({
        device,
        deviceName,
        cmd,
        pitch,
        velocity,
        velocityNorm,
        msgData: msg.data,
      });
    }
    this.midiInputState[msg.data[1]] = msg.data[2];
  }

  // public device getters

  getInputDeviceByName(deviceName) {
    return this.getDeviceByName(deviceName, this.inputDevices);
  }

  getOutputDeviceByName(deviceName) {
    return this.getDeviceByName(deviceName, this.outputDevices);
  }

  // internal device getters

  getDeviceByName(deviceName, devices) {
    let device = devices.find((el) => el.name === deviceName);
    if (!device && devices.length > 0) {
      device = devices[0];
      console.warn("Couldn't find requested device! : " + deviceName);
      console.warn("Returning first device instead: " + devices[0].name);
    }
    if (!device) {
      console.warn("No MIDI input devices found!");
      return null;
    }
    return device;
  }

  // output

  sendOutputByNameNorm(deviceName, pitch, velocity = 1, followNoteOff = false) {
    this.sendOutputByName(
      deviceName,
      pitch,
      Math.round(velocity * 127),
      followNoteOff
    );
  }

  sendOutputByName(deviceName, pitch, velocity = 127, followNoteOff = false) {
    let device = this.getDeviceByName(deviceName, this.outputDevices);
    this.sendOutput(device, pitch, velocity, followNoteOff);
  }

  sendOutputNorm(device, pitch, velocity = 127, followNoteOff = false) {
    this.sendOutput(device, pitch, Math.round(velocity * 127), followNoteOff);
  }

  sendOutput(device, pitch, velocity = 127, followNoteOff = false) {
    if (!device) {
      console.warn("sendOutput() error: No MIDI input device!");
      return null;
    }
    device.send(this.noteOn(pitch, velocity));
    if (followNoteOff) {
      let secondDelay = window.performance.now() + 1000.0;
      device.send(this.noteOff(pitch, 0), secondDelay);
    }
  }

  sendRawData(device, msgData) {
    device.send(msgData);
  }

  // message factory helpers

  noteOn(pitch, velocity = 127) {
    return [MidiInterface.NOTE_ON, pitch, velocity];
  }

  noteOff(pitch) {
    return [MidiInterface.NOTE_OFF, pitch, 0];
  }
}

MidiInterface.CMD_NOTE_ON = 9;
MidiInterface.CMD_NOTE_OFF = 8;
MidiInterface.CMD_PITCH_BEND = 14;
MidiInterface.CMD_CC = 11;

MidiInterface.NOTE_ON = 0x90; // 144
MidiInterface.NOTE_OFF = 0x80; // 128

export default MidiInterface;
