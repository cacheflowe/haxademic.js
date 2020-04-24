class SolidSocketDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [
      "../src/event-log.es6.js",
      "../src/solid-socket.es6.js",
    ], `
    <div class="container">
      <h1>SolidSocket</h1>
      <div>
        <button id="button1">Button 1</button>
        <button id="button2">Button 2</button>
      </div>
      <div id="results"></div>
    </div>`);
  }

  init() {
    this.initSocket();
    this.addClicks();
    this.log = new EventLog(document.getElementById('results'));
  }

  addClicks() {
    this.el = document.querySelector('.container');
    this.el.addEventListener('click', (e) => {
      if(e.target.id == "button1") this.solidSocket.sendJSON({'button':1});
      if(e.target.id == "button2") this.solidSocket.sendJSON({'button':2});
    });
  }

  // SOCKET

  initSocket() {
    this.solidSocket = new SolidSocket('ws://localhost:3001');
    this.solidSocket.setOpenCallback(this.socketOpen.bind(this));
    this.solidSocket.setMessageCallback(this.onMessage.bind(this));
    this.solidSocket.setErrorCallback(() => console.log('Socket [ERROR]'));
    this.solidSocket.setCloseCallback(() => console.log('Socket [CLOSE]'));
  }

  socketOpen(e) {
    this.log.log('socketOpen!');
    this.solidSocket.sendJSON({'hello':'connect!'});
  }

  onMessage(msg) {
    console.log(msg.data);
    this.log.log(JSON.stringify(msg.data));
  }

}

if(window.autoInitDemo) new SolidSocketDemo(document.body);
