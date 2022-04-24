import DemoBase from './demo--base.es6.js';
import AppStoreDebug from '../src/app-store-debug.es6.js';
import AppStoreBroadcastChannel from '../src/app-store-broadcast-channel.es6.js';
import EventLog from '../src/event-log.es6.js';
import PointerPos from '../src/pointer-pos.es6.js';

class AppStoreBroadcastChannelDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [], 'AppStoreBroadcastChannel', 'app-store-broadcast-channel-container', 'Open this demo in multiple windows of the same browser to show off the cross-tab/window communication.');
  }

  init() {
    // init AppStore
    this.appStoreBroadcastChannel = new AppStoreBroadcastChannel('sharedChannelDemo');
    this.appStoreBroadcastChannel.addListener(this);
    this.appStoreDebug = new AppStoreDebug(true);
    
    // add inline logging
    this.log = new EventLog(document.getElementById('debug'));
    this.log.log(`attempting to connect to BroadcastChannel`);

    // add key listener
    window.addEventListener('keydown', (e) => {
      this.log.log(`key pressed: ${e.key}`);
      this.appStoreBroadcastChannel.set('KEY_SHARED', e.key, true);
    });

    // Add Pointerpos for mouse position
    this.pointerPos = new PointerPos((e, x, y) => {
      this.appStoreBroadcastChannel.set('MOUSE_X', x, true);
      this.appStoreBroadcastChannel.set('MOUSE_Y', y, true);
    });
  }

  storeUpdated(key, value) {
    this.log.log(`storeUpdated: ${key} = ${value}`);
  }

}

if(window.autoInitDemo) window.demo = new AppStoreBroadcastChannelDemo(document.body);
