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
    })
  }

  startRecognizer() {
    if(!!this.recognizer) {
      this.recognizer.start();
    } else {
      let resultsEl = document.getElementById('results');
      this.recognizer = new SpeechRecognizer(resultsEl);
    }
  }

  stopRecognizer() {
    this.recognizer.stop();
  }

}

if(window.autoInitDemo) new SpeechRecognizerDemo(document.body);
