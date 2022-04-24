import AppStore from '../src/app-store-.es6.js';

class AppStoreBroadcastChannel extends AppStore {

  constructor(broadcastChannel='sharedChannel') {
    super();

    // init BroadcastChannel API object
    this.bc = new BroadcastChannel(broadcastChannel);
    this.bc.addEventListener('message', (e) => this.onMessage(e));
    this.bc.addEventListener('messageerror', (e) => console.error('AppStoreBroadcastChannel error: ', e));
  }

  onMessage(event) {
    let jsonData = JSON.parse(event.data);
    if(jsonData['store'] && jsonData['type']) {
      this.set(jsonData['key'], jsonData['value']);
    } else {
      this.set('json', jsonData);
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
      // store in local AppStore *and* broadcast to other tabs/windows
      super.set(key, value);
      this.bc.postMessage(JSON.stringify(data));
    } else {
      super.set(key, value);
    }
  }

}

export default AppStoreBroadcastChannel;
