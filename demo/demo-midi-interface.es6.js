import DemoBase from "./demo--base.es6.js";
import EventLog from "../src/event-log.es6.js";
import KeyboardUtil from "../src/keyboard-util.es6.js";
import MidiInterface from "../src/midi-interface.es6.js";

class MidiInterfaceDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "MidiInterface",
      "midi-container",
      "Basic MIDI integration with external devices"
    );
  }

  async init() {
    this.eventLog = new EventLog(this.debugEl);
    this.midiContainer = document.getElementById("midi-container");
    this.startWithButton();
    this.initMidi();
    this.initKeyCommands();
  }

  startWithButton() {
    // add button to start everything
    this.startButton = document.createElement("button");
    this.startButton.innerText = "Start";
    this.midiContainer.appendChild(this.startButton);

    // click to init serial device selector
    this.startButton.addEventListener("click", (e) => {
      this.startButton.parentNode.removeChild(this.startButton);
      this.initMidi();
    });
  }

  initMidi() {
    // build midi hardware interface
    this.midiInterface = new MidiInterface(
      (inputIds, outputIds) => this.storeDeviceIds(inputIds, outputIds),
      (data) => this.midiInputMessage(data),
      (err) => this.midiError(err)
    );
  }

  storeDeviceIds(inputIds, outputIds) {
    // log midi ports
    this.eventLog.log("## new MidiInterface() -----------");
    this.eventLog.log("## inputIds -----------");
    inputIds.forEach((id, i) => this.eventLog.log(`[${i}] ${id}`));
    this.eventLog.log("## outputIds -----------");
    outputIds.forEach((id, i) => this.eventLog.log(`[${i}] ${id}`));

    // listen to something specific
    this.launchpadOut = this.midiInterface.getOutputDeviceByName(
      "MIDIOUT2 (LPMiniMK3 MIDI)"
    );
    this.spdOut = this.midiInterface.getOutputDeviceByName("3- SPD-SX");
    this.midiInterface.listenToAllDevices();
  }

  midiInputMessage({
    pitch,
    velocity,
    velocityNorm,
    deviceName,
    cmd,
    msgData,
  }) {
    if (!pitch) return;

    // log single input event
    this.eventLog.log(
      `note: ${pitch}, velocity: ${velocity}, cmd: ${cmd}, deviceName: ${deviceName}`
    );
    this.midiContainer.innerHTML = `
      <p>
        <h5>Input<h5>
        deviceName: ${deviceName}<br>
        cmd: ${cmd}<br>
        pitch: ${pitch}<br>
        velocity: ${velocity}<br>
        velocityNorm: ${velocityNorm}<br>
        msgData: ${msgData}<br>
      </p>
    `;

    this.forwardInput(this.spdOut, msgData); // trigger spd-sx sounds
    this.forwardInput(this.launchpadOut, msgData); // toggle launchpad lights
  }

  forwardInput(outDevice, msgData) {
    this.midiInterface.sendRawData(outDevice, msgData);
  }

  midiError(err) {
    this.midiContainer.innerHTML = `<p style="color:red;">Error: ${err}</p>`;
  }

  initKeyCommands() {
    KeyboardUtil.addSingleKeyListener("m", (e) => {
      this.midiInterface.sendOutputNorm(this.launchpadOut, 36, Math.random());
    });
  }
}

if (window.autoInitDemo) window.demo = new MidiInterfaceDemo(document.body);
