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
        .text-input-waiting input[type="text"] {
          border-color: #090;
          background-color: #99FF99;
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
        #session-closed {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 100; 
          background-color: rgba(0,0,0,0.5);
        }
        #session-closed-message {
          position: absolute;
          top: 160px;
          margin-left: -25%;
          left: 50%;
          width: 50%;
          background-color: rgba(1,1,1,0.5);
          text-align: center;
          padding: 2rem 0;
          text-transform: uppercase;
          font-size: 1.8rem;
          color: #fff;
          border-radius: 1rem;
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
      <div id="session-closed" class="fade-anim">
        <div id="session-closed-message">Your Session<br>Has Ended</div>
      </div>
    </div>`);
  }

  init() {
    this.el = document.querySelector('.container');
    MobileUtil.setDeviceInputClass();
    MobileUtil.enablePseudoStyles();
    MobileUtil.addFullscreenListener();
    MobileUtil.addFullscreenEl(this.el);
    MobileUtil.disableTextSelect(document.body, true);

    this.addSessionCloseMessage();
    this.initSocket();
    this.initTouchpad();
    this.addClicks();
    this.addTextInput();

    this.log = new EventLog(document.getElementById('results'));
  }

  addClicks() {
    this.el.addEventListener('click', (e) => {
      if(e.target.id == "click-button" || e.target.id == "touchpad") {
        if(this.pointerPos.xDeltaTotal() < 8 && this.pointerPos.yDeltaTotal() < 8) {
          this.solidSocket.sendJSON({'click':true});
        }
      }
    });
  }

  addTextInput() {
    this.textInputEl = document.getElementById('text-input');
    this.textInputEl.addEventListener('keydown', (e) => {
      setTimeout(() => { // can't use `input` event because it doesn't register keyCode, so we have to debounce to have the updated textfield length
        var key = e.keyCode ? e.keyCode : e.which;
        let character = (key != 8) ? this.textInputEl.value.substring(this.textInputEl.value.length - 1) : "";
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

  inputFocused(remoteTextVal) {
    this.el.classList.add('text-input-waiting');
    this.textInputEl.focus();
    this.textInputEl.value = remoteTextVal;
  }

  inputBlur() {
    this.el.classList.remove('text-input-waiting');
    this.textInputEl.blur();
    MobileUtil.hideSoftKeyboard();
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
    if(this.pointerPos.xDeltaTotal() > 8 || this.pointerPos.yDeltaTotal() > 8) {  // minimum movement before sending touch. this allows clicks to be less wiggly
      this.solidSocket.sendJSON({
        'pointerXDelta': deltaX,
        'pointerYDelta': deltaY,
      });
    }
  }

  // SOCKET

  initSocket() {
    this.solidSocket = new SolidSocket('ws://192.168.1.3:3001?roomId=987654321&clientType=touchpad');
    // this.solidSocket = new SolidSocket('ws://localhost:3001?roomId=987654321&clientType=touchpad');
    this.solidSocket.setOpenCallback(this.socketOpen.bind(this));
    this.solidSocket.setMessageCallback(this.onMessage.bind(this));
    this.solidSocket.setErrorCallback(this.socketError.bind(this));
    this.solidSocket.setCloseCallback(this.socketClose.bind(this));
    this.solidSocket.setConnectionCallback(this.socketIsActive.bind(this));
  }

  socketOpen(e) {
    this.log.log('socketOpen!');
    this.solidSocket.sendJSON({
      'role': 'touchpad',
      'pointerStateConnected': true,
    });
  }

  socketClose(e) {
    // this probably won't do anything.. disconnected needs to come from ws:// server
    // only gets triggered if the websocket server disappears. can this be the mechanism to kick people off and say session is over?
    this.showSessionEnded();
    this.log.log('socketClose!');
    this.solidSocket.sendJSON({
      'pointerStateDisconnected': true,
    });
  }

  socketError(e) {
    this.log.log('socketError(e)');
  }

  onMessage(msg) {
    let jsonData = JSON.parse(msg.data);
    // receive data from the kiosk
    if(typeof jsonData.kioskInputFocus == "string") this.inputFocused(jsonData.kioskInputFocus);
    if(typeof jsonData.kioskInputBlur == "string") this.inputBlur(jsonData.kioskInputBlur);
    this.log.log(JSON.stringify(msg.data));
  }

  socketIsActive(isActive) {
    if(isActive == false) this.showSessionEnded();
  }

  showSessionEnded() {
    this.sessionEndEl.classList.add('show');
    this.solidSocket.dispose();
    MobileUtil.hideSoftKeyboard();
  }

  // SESSION 

  addSessionCloseMessage() {
    this.sessionEndEl = this.el.querySelector('#session-closed');
  }

}

if(window.autoInitDemo) window.demo = new SolidSocketTouchpadDemo(document.body);
