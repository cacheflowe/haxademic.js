import AppStore from '../src/app-store-.es6.js';
import SolidSocket from '../src/solid-socket.es6.js';

class AppStoreDistributed extends AppStore {

  constructor(socketServerUrl) {
    super();
    // init websock connection
    this.socketServerUrl = socketServerUrl;
    this.solidSocket = new SolidSocket(socketServerUrl);
    this.solidSocket.setOpenCallback((e) => this.onOpen(e));
    this.solidSocket.setMessageCallback((e) => this.onMessage(e));
  }

  onOpen() {
    console.log('AppStoreDistributed connected to ' + this.socketServerUrl);
    this.set(AppStoreDistributed.CONNECTED, this.socketServerUrl);
  }

  onMessage(event) {
    let jsonData = JSON.parse(event.data);
    if(jsonData['store'] && jsonData['type']) {
      this.set(jsonData['key'], jsonData['value']);
    } else {
      this.set('json', jsonData);
      // this.set('json', event.data); // just to see data in AppStoreDebug
    }
  };

  set(key, value, broadcast) {
    if(broadcast) {
      // get data type for java AppStore
      var type = "number";
      if(typeof value === "boolean") type = "boolean";
      if(typeof value === "string") type = "string";
      // set json object for AppStore
      let data = {
        key: key,
        value: value,
        store: true,
        type: type
      };
      this.solidSocket.sendMessage(JSON.stringify(data)); // local AppStore is updated when message is broadcast back to us
    } else {
      super.set(key, value);
    }
  }

  broadcastJson(obj) {
    this.solidSocket.sendMessage(JSON.stringify(obj));
  }

}

AppStoreDistributed.CONNECTED = "AppStoreDistributed_CONNECTED";

export default AppStoreDistributed;
