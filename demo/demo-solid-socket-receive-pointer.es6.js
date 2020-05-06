class SolidSocketDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [
      "../src/easing-float.es6.js",
      "../src/event-log.es6.js",
      "../src/frame-loop.es6.js",
      "../src/keyboard-util.es6.js",
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
          transition: fill 0.15s linear;
        }
        #pointer.touching svg {
          fill: #009900;
        }
        #buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
          grid-gap: 1rem;
        }
        #buttons button {
          margin-bottom: 0;
          padding: 0;
        }
        #qr-container {
          position: fixed;
          top: 2rem;
          right: 2rem;
        }
        #results {
          font-size: 12px;
          margin-bottom: 1rem;
        }
      </style>
      <h1>Receive Pointer</h1>
      <div id="text-container"><input stype="text" id="textfield-1"></div>
      <div id="results"></div>
      <div id="buttons"></div>
      <div id="qr-container"></div>
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
    this.pointerXNorm = new EasingFloat(0.5, 5);
    this.pointerYNorm = new EasingFloat(0.5, 5);
    this.pointerX = new EasingFloat(window.innerWidth * 0.5, 5);
    this.pointerY = new EasingFloat(window.innerHeight * 0.5, 5);
    this.pointerScale = new EasingFloat(0, 5);
    this.pointerEl = document.getElementById('pointer');
    this.log = new EventLog(document.getElementById('results'), 1);

    var qrcode = new QRCode("qr-container", {
      text: window.location.href.replace('-receive-pointer', '-touchpad'),
      width: 80,
      height: 80,
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

    // listen for button & input clicks & log them
    this.el = document.querySelector('.container');
    this.el.addEventListener('click', (e) => {
      // log when buttons are clicked, just for demo
      if(e.target.hasAttribute('id')) this.log.log('Clicked: ' + e.target.id);
      // highlight/focus textfield when clicked, then blur when clicked elsewhere to we stop accepting keystrokes from abroad
      if(e.target.nodeName.toLowerCase() == 'input') {
        this.inputEl = e.target;
        e.target.focus();
        this.solidSocket.sendJSON({'kioskInputFocus': e.target.value}); // send current textfield contents to touchpad
      } else {
        if(this.inputEl) {
          this.inputEl.blur();
          this.inputEl = null;
          this.solidSocket.sendJSON({'kioskInputBlur': e.target.value}); // send current textfield contents to touchpad
        }
      }
    });
  }

  // POINTER

  remoteClick() {
    PointerUtil.clickDocumentAtPoint(this.pointerX.value(), this.pointerY.value());
  }

  frameLoop(frameCount) {
    this.pointerX.update();
    this.pointerY.update();
    this.pointerScale.update();
    this.pointerEl.style.setProperty('transform', `translate3d(${this.pointerX.value()}px, ${this.pointerY.value()}px, 0) scale(${this.pointerScale.value()})`);
  }

  // textfield

  // do anything? keyboard simulate might just handle it

  // SOCKET

  initSocket() {
    this.solidSocket = new SolidSocket('ws://192.168.1.3:3001?roomId=987654321&clientType=kiosk');
    this.solidSocket.setOpenCallback(this.socketOpen.bind(this));
    this.solidSocket.setMessageCallback(this.onMessage.bind(this));
    this.solidSocket.setErrorCallback(() => console.log('Socket [ERROR]'));
    this.solidSocket.setCloseCallback(() => console.log('Socket [CLOSE]'));
  }

  socketOpen(e) {
    this.log.log('socketOpen!');
    this.solidSocket.sendJSON({'role': 'kiosk'});
  }

  onMessage(msg) {
    // get incoming data
    let json = JSON.parse(msg.data);
    // handle normalize pointer mode
    if(json.pointerXNorm && json.pointerYNorm) {
      this.pointerX.setTarget(json.pointerXNorm * window.innerWidth);
      this.pointerY.setTarget(json.pointerYNorm * window.innerHeight);
    }
    // handle delta pointer mode
    else if(json.pointerXDelta || json.pointerYDelta) {
      this.pointerX.setTarget(this.pointerX.target() + json.pointerXDelta);
      this.pointerY.setTarget(this.pointerY.target() + json.pointerYDelta);
      // if pointerStateStart wasn't triggers, show pointer with interaction
      this.pointerEl.classList.add('touching');
      this.pointerScale.setTarget(1);
    }
    // handle pointer states
    if(json.pointerStateStart) {
      this.pointerEl.classList.add('touching');
      // document.elementFromPoint(this.pointerX.value(), this.pointerY.value()).dispatchEvent(new MouseEvent("mousedown"));
    }
    if(json.pointerStateEnd) {
      this.pointerEl.classList.remove('touching');
      // document.elementFromPoint(this.pointerX.value(), this.pointerY.value()).dispatchEvent(new MouseEvent("mouseup"));
    }
    if(json.pointerStateConnected) {
      this.pointerScale.setTarget(1);
    }
    if(json.pointerStateDisconnected) {
      this.pointerScale.setTarget(0);
    }
    // handle clicks
    if(json.click) {
      this.remoteClick();
    }
    // handle text input
    if(json.keyCode) {
      this.log.log(JSON.stringify(json));
      if(this.inputEl) {
        KeyboardUtil.keyPressSimulateOnTextfield(this.inputEl, json.keyCode, json.character);
      }
    }
  }

}

if(window.autoInitDemo) window.demo = new SolidSocketDemo(document.body);
