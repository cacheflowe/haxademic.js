class SolidSocketDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [
      "../src/easing-float.es6.js",
      "../src/event-log.es6.js",
      "../src/frame-loop.es6.js",
      "../src/pointer-pos.es6.js",
      "../src/pointer-util.es6.js",
      "../src/solid-socket.es6.js",
      "../vendor/qrcode.min.js",
    ], `
    <div class="container">
      <style>
        html, body {
          width: 100%;
          height: 100vh;
        }
        #pointer {
          position: absolute;
          width: 30px;
          height: 30px;
          left: 0;
          top: 0;
          pointer-events: none;
        }
        #pointer svg {
          width: 100%;
          height: 100%;
        }
      </style>
      <h1>SolidSocket | Receive Pointer</h1>
      <div id="buttons"></div>
      <div id="qr-container"></div>
      <div id="results"></div>
      <div id="pointer">
        <svg height="300px" width="300px" fill="#000000" xmlns="http://www.w3.org/2000/svg" data-name="Layer 1" viewBox="0 0 100 100" x="0px" y="0px">
          <polygon points="0 0 0 95 20 60 60 62 0 0"/>
        </svg>
      </div>
    </div>`);
  }

  init() {
    this.initSocket();
    this.addClicks();
    window._frameLoop = new FrameLoop();
    _frameLoop.addListener(this);
    this.mouseX = new EasingFloat(0.5, 5);
    this.mouseY = new EasingFloat(0.5, 5);
    this.pointerEl = document.getElementById('pointer');
    this.log = new EventLog(document.getElementById('results'));

    var qrcode = new QRCode("qr-container", {
      text: window.location.href.replace('-receive-pointer', ''),
      width: 128,
      height: 128,
      colorDark : "#000000",
      colorLight : "#ffffff",
      // correctLevel : QRCode.CorrectLevel.H
    });
  }

  addClicks() {
    // create buttons
    for (let i = 0; i < 30; i++) {
      document.getElementById('buttons').innerHTML += `<button id="button${i+1}">Button ${i+1}</button>`;
    }

    // listen for button clicks
    this.el = document.querySelector('.container');
    this.el.addEventListener('click', (e) => {
      if(e.target.hasAttribute('id')) this.log.log('Clicked: ' + e.target.id);
    });
  }

  // POINTER

  remoteClick() {
    let pointerX = this.mouseX.value() * window.innerWidth;
    let pointerY = this.mouseY.value() * window.innerHeight;
    PointerUtil.clickDocumentAtPoint(pointerX, pointerY);
  }

  frameLoop(frameCount) {
    this.mouseX.update();
    this.mouseY.update();

    let pointerX = this.mouseX.value() * window.innerWidth;
    let pointerY = this.mouseY.value() * window.innerHeight;
    this.pointerEl.style.setProperty('transform', `translate3d(${pointerX}px, ${pointerY}px, 0)`);
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
    // console.log(msg.data);
    let json = JSON.parse(msg.data);
    if(json.click) {
      this.remoteClick();
      this.log.log('Remote click');
    }
    if(json.pointerX) this.mouseX.setTarget(json.pointerX);
    if(json.pointerY) this.mouseY.setTarget(json.pointerY);
  }

}

if(window.autoInitDemo) new SolidSocketDemo(document.body);
