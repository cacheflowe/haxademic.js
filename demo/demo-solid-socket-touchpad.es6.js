class SolidSocketTouchpadDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [
      "../src/event-log.es6.js",
      "../src/mobile-util.es6.js",
      "../src/pointer-pos.es6.js",
      "../src/solid-socket.es6.js",
    ], `
    <div class="container">
      <style>
        div.container {
          padding: 0;
          /* below required for fullscreen */
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
        }
        header, 
        footer {
          background-color: #111;
          padding: 20px;
        }
        input[type="text"], 
        button#click-button {
          height: 40px;
          font-size: 20px;
          margin: 0;
          width: 100%;
          background: #fefefe;
        }
        button#click-button {
          border-radius: 20px;
        }
        #touchpad-outer {
          padding: 20px;
          height: calc(100% - 160px);
        }
        #touchpad {
          height: 100%;
          background: #fefefe;
          border: 1px solid #999;
        }
        #results {
          pointer-events: none;
          font-size: 8px;
          margin-top: 20px;
          margin-left: 20px;
        }
      </style>
      <header>
        <input type="text" id="text-input" placeholder="Type here" />
      </header>
      <div id="touchpad-outer">
        <div id="touchpad"><div id="results"></div></div>
      </div>
      <footer>
        <button id="click-button">CLICK</button>
      </footer>
    </div>`);
  }

  init() {
    this.el = document.querySelector('.container');
    MobileUtil.setDeviceInputClass();
    MobileUtil.enablePseudoStyles();
    MobileUtil.addFullscreenListener();
    MobileUtil.addFullscreenEl(this.el);
    MobileUtil.disableTextSelect(document.body, true);

    this.initSocket();
    this.initTouchpad();
    this.addClicks();
    this.addTextInput();

    this.log = new EventLog(document.getElementById('results'));
  }

  addClicks() {
    
    this.el.addEventListener('click', (e) => {
      if(e.target.id == "click-button") this.solidSocket.sendJSON({'click':true});
      if(e.target.id == "touchpad") this.solidSocket.sendJSON({'click':true});
    });
  }

  addTextInput() {
    let textInputEl = document.getElementById('text-input');
    textInputEl.addEventListener('keydown', (e) => {
      console.log("TODO: make sure text length has changed before sending new character");
      setTimeout(() => { // can't use `input` event because it doesn't register keyCode, so we have to debounce to have the updated textfield length
        var key = e.keyCode ? e.keyCode : e.which;
        let character = (key != 8) ? textInputEl.value.substring(textInputEl.value.length - 1) : "";
        let jsonOut = {
          'keyCode': key, 
          // 'shift': e.shift, 
          'character': character,
        };
        this.solidSocket.sendJSON(jsonOut);
        this.log.log(JSON.stringify(jsonOut));
      }, 50);
    });

  }

  // POINTER

  initTouchpad() {
    MobileUtil.lockTouchScreen(true);
    this.pointerPos = new PointerPos(this.pointerMoved.bind(this), this.pointerStart.bind(this), this.pointerEnd.bind(this));
    this.touchpadEl = document.getElementById('touchpad');
  }

  pointerMoved(x, y, deltaX, deltaY) {
    // this.sendPointerNormalized();
    this.sendPointerDelta(deltaX, deltaY);
  }

  pointerStart() {
    this.log.log('pointerStart(): '+this.pointerInsideTouchpad());
    if(this.pointerInsideTouchpad() == false) return;
    MobileUtil.hideSoftKeyboard();
    this.solidSocket.sendJSON({
      'pointerStateStart': true,
    });
  }

  pointerEnd() {
    this.solidSocket.sendJSON({
      'pointerStateEnd': true,
    });
  }

  sendPointerNormalized() {
    let xNorm = this.pointerPos.xPercent(this.touchpadEl);
    let yNorm = this.pointerPos.yPercent(this.touchpadEl);
    if(xNorm >= 0 && xNorm <= 1 && yNorm >= 0 && yNorm <= 1) {
      this.solidSocket.sendJSON({
        'pointerXNorm': xNorm,
        'pointerYNorm': yNorm,
      });
    }
  }

  pointerInsideTouchpad() {
    let xNorm = this.pointerPos.xPercent(this.touchpadEl);
    let yNorm = this.pointerPos.yPercent(this.touchpadEl);
    return (xNorm >= 0 && xNorm <= 1 && yNorm >= 0 && yNorm <= 1);
  }

  sendPointerDelta(deltaX, deltaY) {
    if(this.pointerInsideTouchpad() == false) return;
    if(this.pointerPos.xDeltaTotal() > 8 || this.pointerPos.yDeltaTotal() > 8) {
      this.solidSocket.sendJSON({
        'pointerXDelta': deltaX,
        'pointerYDelta': deltaY,
      });
    }
  }

  // SOCKET

  initSocket() {
    this.solidSocket = new SolidSocket('ws://192.168.1.3:3001?roomId=987654321');
    // this.solidSocket = new SolidSocket('ws://localhost:3001?roomId=987654321');
    this.solidSocket.setOpenCallback(this.socketOpen.bind(this));
    this.solidSocket.setMessageCallback(this.onMessage.bind(this));
    this.solidSocket.setErrorCallback(() => console.log('Socket [ERROR]'));
    this.solidSocket.setCloseCallback(() => this.socketClose.bind(this));
  }

  socketOpen(e) {
    this.log.log('socketOpen!');
    this.solidSocket.sendJSON({
      'role': 'touchpad',
      'pointerStateConnected': true,
    });
  }

  socketClose(e) {
    this.log.log('socketOpen!');
    this.solidSocket.sendJSON({
      'pointerStateDisconnected': true,
    });
  }

  onMessage(msg) {
    // console.log(msg.data);
    this.log.log(JSON.stringify(msg.data));
  }

}

if(window.autoInitDemo) new SolidSocketTouchpadDemo(document.body);
