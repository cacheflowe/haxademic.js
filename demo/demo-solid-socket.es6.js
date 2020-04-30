class SolidSocketDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [
      "../src/event-log.es6.js",
      "../src/mobile-util.es6.js",
      "../src/pointer-pos.es6.js",
      "../src/solid-socket.es6.js",
    ], `
    <div class="container">
      <style>
        html, body {
          width: 100%;
          height: 100vh;
        }
        #results {
          pointer-events: none;
        }
      </style>
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
    this.pointerPos = new PointerPos(this.pointerMoved.bind(this));
    this.log = new EventLog(document.getElementById('results'));
    MobileUtil.lockTouchScreen(true);
  }

  addClicks() {
    this.el = document.querySelector('.container');
    this.el.addEventListener('click', (e) => {
      if(e.target.id == "button1") this.solidSocket.sendJSON({'button':1});
      if(e.target.id == "button2") this.solidSocket.sendJSON({'button':2});
    });
    document.body.addEventListener('click', (e) => {
      this.solidSocket.sendJSON({
        'pointerX': this.pointerPos.xPercent(),
        'pointerY': this.pointerPos.yPercent(),
        'click': true,
      });
    });
  }

  // POINTER

  pointerMoved(x, y) {
    this.solidSocket.sendJSON({
      'pointerX': this.pointerPos.xPercent(),
      'pointerY': this.pointerPos.yPercent(),
    });
  }

  // SOCKET

  initSocket() {
    this.solidSocket = new SolidSocket('ws://192.168.1.3:3001?roomId=987654321');
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
