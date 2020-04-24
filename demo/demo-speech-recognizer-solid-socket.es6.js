class SpeechRecognizerSolidSocketDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [
      "../src/solid-socket.es6.js",
      "../src/speech-recognizer.es6.js",
    ], `
    <div class="container">
      <h1>SpeechRecognizer + SolidSocket</h1>
      <div>
        <button id="startMic">Start mic</button>
        <button id="stopMic">Stop mic</button>
      </div>
      <div id="results"></div>
    </div>`);
  }

  init() {
    this.initSocket();
    this.initSpeechRecognizer();
  }

  // SOCKET

  initSocket() {
    this.solidSocket = new SolidSocket('ws://localhost:3001');
    this.solidSocket.setOpenCallback(() => console.log('Socket [OPEN]'));
    this.solidSocket.setMessageCallback((msg) => console.log('Socket [MESSAGE]', msg));
    this.solidSocket.setErrorCallback(() => console.log('Socket [ERROR]'));
    this.solidSocket.setCloseCallback(() => console.log('Socket [CLOSE]'));
  }

  // SPEECH

  initSpeechRecognizer() {
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
    this.solidSocket.sendJSON({'word':newWord});
  }

  stopRecognizer() {
    this.recognizer.stop();
  }

}

if(window.autoInitDemo) new SpeechRecognizerSolidSocketDemo(document.body);
