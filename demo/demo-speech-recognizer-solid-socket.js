import DemoBase from "./demo--base.js";
import SolidSocket from "../src/solid-socket.js";
import SpeechRecognizer from "../src/speech-recognizer.js";

class SpeechRecognizerSolidSocketDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "SpeechRecognizer + SolidSocket",
      "speech-recognizer-solid-socket-demo",
      "Use the Web Speech API to recognize speech and send results via WebSockets."
    );
  }

  init() {
    this.injectHTML(`
      <div>
        <button id="startMic">Start mic</button>
        <button id="stopMic">Stop mic</button>
      </div>
    `);
    this.initSocket();
    this.initSpeechRecognizer();
  }

  // SOCKET

  initSocket() {
    this.solidSocket = new SolidSocket("ws://localhost:3001/ws");
    this.solidSocket.setOpenCallback(() => console.log("Socket [OPEN]"));
    this.solidSocket.setMessageCallback((msg) =>
      console.log("Socket [MESSAGE]", msg)
    );
    this.solidSocket.setErrorCallback(() => console.log("Socket [ERROR]"));
    this.solidSocket.setCloseCallback(() => console.log("Socket [CLOSE]"));
  }

  // SPEECH

  initSpeechRecognizer() {
    this.el = document.querySelector(".container");
    this.el.addEventListener("click", (e) => {
      if (e.target.id == "startMic") this.startRecognizer();
      if (e.target.id == "stopMic") this.stopRecognizer();
    });
  }

  startRecognizer() {
    if (!!this.recognizer) {
      this.recognizer.start();
    } else {
      let resultsEl = document.getElementById("results");
      let wordCallback = this.wordCallback.bind(this);
      this.recognizer = new SpeechRecognizer(wordCallback, resultsEl);
    }
  }

  wordCallback(newWord) {
    this.solidSocket.sendJSON({ word: newWord });
  }

  stopRecognizer() {
    this.recognizer.stop();
  }
}

if (window.autoInitDemo)
  window.demo = new SpeechRecognizerSolidSocketDemo(document.body);
