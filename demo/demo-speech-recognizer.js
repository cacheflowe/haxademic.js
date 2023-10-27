import DemoBase from "./demo--base.js";
import SpeechRecognizer from "../src/speech-recognizer.js";

class SpeechRecognizerDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "SpeechRecognizer",
      "speech-recognizer-demo",
      "Use the Web Speech API to recognize speech."
    );
  }

  init() {
    this.injectHTML(`
      <div>
        <button id="startMic">Start mic</button>
        <button id="stopMic">Stop mic</button>
      </div>
    `);
    this.el.addEventListener("click", (e) => {
      if (e.target.id == "startMic") this.startRecognizer();
      if (e.target.id == "stopMic") this.stopRecognizer();
    });
  }

  startRecognizer() {
    if (!!this.recognizer) {
      this.recognizer.start();
    } else {
      let wordCallback = this.wordCallback.bind(this);
      this.recognizer = new SpeechRecognizer(wordCallback, this.debugEl);
    }
  }

  wordCallback(newWord) {
    console.log("new word: ", newWord);
  }

  stopRecognizer() {
    this.recognizer.stop();
  }
}

if (window.autoInitDemo) window.demo = new SpeechRecognizerDemo(document.body);
