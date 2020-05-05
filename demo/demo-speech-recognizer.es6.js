class SpeechRecognizerDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [
      "../src/speech-recognizer.es6.js",
    ], `
    <div class="container">
      <h1>SpeechRecognizer</h1>
      <div>
        <button id="startMic">Start mic</button>
        <button id="stopMic">Stop mic</button>
      </div>
      <div id="results"></div>
    </div>`);
  }

  init() {
    this.el = document.querySelector('.container');
    this.el.addEventListener('click', (e) => {
      if(e.target.id == "startMic") this.startRecognizer();
      if(e.target.id == "stopMic") this.stopRecognizer();
    });
  }

  startRecognizer() {
    if(!!this.recognizer) {
      this.recognizer.start();
    } else {
      let resultsEl = document.getElementById('results');
      let wordCallback = this.wordCallback.bind(this);
      this.recognizer = new SpeechRecognizer(wordCallback, resultsEl);
    }
  }

  wordCallback(newWord) {
    console.log('new word: ', newWord);
  }

  stopRecognizer() {
    this.recognizer.stop();
  }

}

if(window.autoInitDemo) window.demo = new SpeechRecognizerDemo(document.body);
