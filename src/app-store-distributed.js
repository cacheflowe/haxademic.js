import AppStore from "../src/app-store-.es6.js";
import SolidSocket from "../src/solid-socket.es6.js";

class AppStoreDistributed extends AppStore {
  static CONNECTED = "AppStoreDistributed_CONNECTED";
  static DISCONNECTED = "AppStoreDistributed_DISCONNECTED";
  static CUSTOM_JSON = "CUSTOM_JSON";

  constructor(socketServerUrl) {
    super();
    // track whether messages are from this instance
    this.messageFromSelf = false;
    // init websocket connection
    this.socketServerUrl = socketServerUrl;
    this.solidSocket = new SolidSocket(socketServerUrl);
    this.solidSocket.setOpenCallback((e) => this.onOpen(e));
    this.solidSocket.setCloseCallback((e) => this.onClose(e));
    this.solidSocket.setMessageCallback((e) => this.onMessage(e));
  }

  generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      var d = new Date().getTime();
      d += performance.now(); // use high-precision timer if available
      var r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  initSenderID() {
    this.uuid = this.generateUUID();
    return this.uuid;
  }

  senderId() {
    return this.uuid;
  }

  senderIsSelf() {
    return this.messageFromSelf;
  }

  onOpen() {
    console.log("AppStoreDistributed connected: " + this.socketServerUrl);
    this.set(AppStoreDistributed.CONNECTED, this.socketServerUrl);
  }

  onClose() {
    console.log("AppStoreDistributed disconnected: " + this.socketServerUrl);
    this.set(AppStoreDistributed.DISCONNECTED, this.socketServerUrl);
  }

  onMessage(event) {
    let data = JSON.parse(event.data);

    // note whether sender is self, so we can check before taking action on incoming data that was sent by us, with senderIsSelf()
    this.messageFromSelf = data && data.sender && data.sender == this.uuid;

    // set incoming data on AppStore
    if (data["store"] && data["type"]) {
      this.set(data["key"], data["value"]);
    } else {
      this.set(AppStoreDistributed.CUSTOM_JSON, data);
    }
  }

  set(key, value, broadcast) {
    if (broadcast) {
      // get data type for java AppStore
      var type = "number";
      if (typeof value === "boolean") type = "boolean";
      if (typeof value === "string") type = "string";
      // set json object for AppStore
      let data = {
        key: key,
        value: value,
        store: true,
        type: type,
      };
      if (this.uuid) data.sender = this.uuid;
      this.solidSocket.sendMessage(JSON.stringify(data)); // local AppStore is updated when message is broadcast back to us
    } else {
      super.set(key, value);
    }
  }

  broadcastCustomJson(obj) {
    this.solidSocket.sendMessage(JSON.stringify(obj));
  }
}

export default AppStoreDistributed;
