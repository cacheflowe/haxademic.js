import DemoBase from './demo--base.es6.js';
import EventLog from '../src/event-log.es6.js';
import MobileUtil from '../src/mobile-util.es6.js';
import PointerPos from '../src/pointer-pos.es6.js';
import SolidSocket from '../src/solid-socket.es6.js';
import URLUtil from '../src/url-util.es6.js';

class SolidSocketDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [], `
    <div class="container">
      <style>
        html, body {
          width: 100%;
          height: 100vh;
        }
        #results {
          pointer-events: none;
        }
        .has-socket h1 {
          color: #00ff00;
        }
        .no-socket h1 {
          color: #ff0000;
        }
      </style>
      <h1>SolidSocket</h1>
      <div>
        <button id="button1">Button 1</button>
        <button id="button2">Button 2</button>
      </div>
      <div id="results"></div>
    </div>`, null, 'Add your socket server address to the URL as a hash: #server=ws://192.168.1.171:3001');
  }

  init() {
    this.log = new EventLog(document.getElementById('results'));
    this.pointerPos = new PointerPos(this.pointerMoved.bind(this));
    this.initSocket();
    this.addClicks();
    // MobileUtil.lockTouchScreen(true);
  }

  addClicks() {
    this.el = document.querySelector('.container');
    this.el.addEventListener('click', (e) => {
      if(e.target.id == "button1") this.solidSocket.sendJSON({'button':1});
      if(e.target.id == "button2") this.solidSocket.sendJSON({'button':2});
    });
    document.body.addEventListener('click', (e) => {
      this.solidSocket.sendJSON({
        'pointerX': this.pointerPos.xNorm(),
        'pointerY': this.pointerPos.yNorm(),
        'click': true,
      });
    });
  }

  // POINTER

  pointerMoved(x, y) {
    this.solidSocket.sendJSON({
      'pointerX': this.pointerPos.xNorm(),
      'pointerY': this.pointerPos.yNorm(),
    });
  }

  // SOCKET

  initSocket() {
    // get address from querystring
    let serverAddr = URLUtil.getHashQueryVariable('server') || 'ws://192.168.1.171:3001';
    this.log.log(`attempting to connect to ${serverAddr}`);

    // this.solidSocket = new SolidSocket(`${serverAddr}?roomId=987654321`);
    this.solidSocket = new SolidSocket(`${serverAddr}`);
    this.solidSocket.setOpenCallback(this.onOpen.bind(this));
    this.solidSocket.setMessageCallback(this.onMessage.bind(this));
    this.solidSocket.setErrorCallback(this.onError.bind(this));
    this.solidSocket.setCloseCallback(this.onClose.bind(this));
  }

  onOpen(e) {
    this.log.log('SolidSocket.onOpen()', '#55ff55');
    this.solidSocket.sendJSON({'hello':'connect!'});
  }
  
  onMessage(msg) {
    // console.log(msg.data);
    this.log.log(JSON.stringify(msg.data));
  }

  onError(e) {
    this.log.log(`SolidSocket.onError() ${(e.message) ? ': '+e.message : ''}`, '#ff5555');
    console.log('onError', e);
  }
  
  onClose(e) {
    this.log.log('SolidSocket.onClose()', '#ff5555');
    console.log('onClose', e);
  }

}

if(window.autoInitDemo) window.demo = new SolidSocketDemo(document.body);
