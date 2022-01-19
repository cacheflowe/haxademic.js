import DemoBase from './demo--base.es6.js';
import AppStoreDebug from '../src/app-store-debug.es6.js';
import AppStoreDistributed from '../src/app-store-distributed.es6.js';
import EventLog from '../src/event-log.es6.js';
import PointerPos from '../src/pointer-pos.es6.js';
import URLUtil from '../src/url-util.es6.js';

class AppStoreDistributedDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [], 'AppStoreDistributed', 'app-store-distributed-container');
  }

  init() {
    // add inline logging
    this.log = new EventLog(document.getElementById('debug'));
    
    // get address from querystring
    let serverAddr = URLUtil.getHashQueryVariable('server') || 'ws://192.168.1.171:3001';
    this.log.log(`attempting to connect to ${serverAddr}`);
    
    // init AppStore
    this.appStoreDistributed = new AppStoreDistributed(serverAddr);
    this.appStoreDebug = new AppStoreDebug(true);
    this.appStoreDistributed.addListener(this);

    // add key listener
    window.addEventListener('keydown', (e) => {
      this.log.log(`key pressed: ${e.key}`);
      this.appStoreDistributed.set('KEY_SHARED', e.key, true);
    });

    // Add Pointerpos for mouse position
    this.pointerPos = new PointerPos((e, x, y) => {
      this.appStoreDistributed.set('MOUSE_X', x, true);
      this.appStoreDistributed.set('MOUSE_Y', y, true);
    });
  }

  storeUpdated(key, value) {
    this.log.log(`storeUpdated: ${key} = ${value}`);
  }

}

if(window.autoInitDemo) window.demo = new AppStoreDistributedDemo(document.body);
