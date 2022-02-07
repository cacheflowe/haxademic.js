class SolidSocket {

  constructor(wsURL) {
    this.active = true;
    this.wsURL = wsURL;
    this.setClassesDisconnected();
    this.bindCallbacks();
    this.buildSocketObject();
    this.startMonitoringConnection();
  }

  // State

  setClassesConnected() {
    document.body.classList.add('has-socket');
    document.body.classList.remove('no-socket');
  }

  setClassesDisconnected() {
    document.body.classList.add('no-socket');
    document.body.classList.remove('has-socket');
  }

  // Public methods

  setURL(wsURL) {
    this.wsURL = wsURL;
    if(this.socket) this.socket.close();
  }

  isConnected() {
    return this.socket.readyState === WebSocket.OPEN;
  }

  isConnecting() {
    return this.socket.readyState === WebSocket.CONNECTING;
  }

  // WebSocket LISTENERS

  bindCallbacks() {
    this.openHandler = this.onOpen.bind(this);
    this.messageHandler = this.onMessage.bind(this);
    this.errorHandler = this.onError.bind(this);
    this.closeHandler = this.onClose.bind(this);
  }

  addSocketListeners() {
    this.socket.addEventListener('open', this.openHandler);
    this.socket.addEventListener('message', this.messageHandler);
    this.socket.addEventListener('error', this.errorHandler);
    this.socket.addEventListener('close', this.closeHandler);
  }

  removeSocketListeners() {
    if(!this.socket) return;
    this.socket.removeEventListener('open', this.openHandler);
    this.socket.removeEventListener('message', this.messageHandler);
    this.socket.removeEventListener('error', this.errorHandler);
    this.socket.removeEventListener('close', this.closeHandler);
    this.socket.close();
  }

  // CALLBACKS

  onOpen(e) {
    this.setClassesConnected();
    if(this.openCallback) this.openCallback(e);
    if(this.connectionActiveCallback) this.connectionActiveCallback(true);
  }

  setOpenCallback(callback) {
    this.openCallback = callback;
  }

  onMessage(e) {
    if(this.messageCallback) this.messageCallback(e);
  }

  setMessageCallback(callback) {
    this.messageCallback = callback;
  }

  onError(e) {
    this.setClassesDisconnected();
    if(this.errorCallback) this.errorCallback(e);
  }

  setErrorCallback(callback) {
    this.errorCallback = callback;
  }

  onClose(e) {
    this.setClassesDisconnected();
    this.resetConnectionAttemptTime();
    if(this.closeCallback) this.closeCallback(e);
  }

  setCloseCallback(callback) {
    this.closeCallback = callback;
  }

  setConnectionActiveCallback(callback) {
    this.connectionActiveCallback = callback;
  }

  // SEND

  sendMessage(message) {
    if(this.isConnected()) {
      this.socket.send(message);
    } else {
      if(this.errorCallback) this.errorCallback({message:'SolidSocket.sendMessage() failed - not connected'});
    }
  }

  sendJSON(data) {
    this.sendMessage(JSON.stringify(data));
  }

  // MONITORING & RECONNECTION

  buildSocketObject() {
    this.removeSocketListeners();
    this.socket = new WebSocket(this.wsURL);
    this.addSocketListeners();
  }

  startMonitoringConnection() {
    this.resetConnectionAttemptTime();
    this.checkConnection();
  }

  resetConnectionAttemptTime() {
    this.lastConnectAttemptTime = Date.now();
  }

  checkConnection() {
    // check for disconnected socket & reinitialize if needed
    // do this on an interval with raf, since setTimeouts/setIntervals 
    // are less reliable to actually happen when you come back to an inactive browser tab
    let timeForReconnect = Date.now() > this.lastConnectAttemptTime + SolidSocket.RECONNECT_INTERVAL;
    if(timeForReconnect) {
      this.resetConnectionAttemptTime();
      // clean up failed socket object, and
      // initialize a new socket object
      let needsNewSocket = !this.isConnected() && !this.isConnecting();
      if(needsNewSocket) {
        this.buildSocketObject();
      }
    }
    // keep checking connection until disposed
    if(this.active == true) {
      requestAnimationFrame(() => this.checkConnection());
    }
  }

  // CLEANUP

  dispose() {
    this.active = false;
    this.removeSocketListeners();
  }

}

SolidSocket.RECONNECT_INTERVAL = 5000;

export default SolidSocket;
