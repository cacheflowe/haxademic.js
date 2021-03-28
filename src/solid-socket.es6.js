class SolidSocket {

  constructor(wsURL) {
    document.body.classList.add('no-socket');
    this.active = true;
    this.wsURL = wsURL;
    this.socket = new WebSocket(wsURL);
    this.addSocketListeners();
    this.lastConnectAttemptTime = Date.now();
    this.startMonitoringConnection();
  }

  // Public methods

  setURL(wsURL) {
    this.wsURL = wsURL;
    if(this.socket) this.socket.close();
  }

  isConnected() {
    return this.socket.readyState === WebSocket.OPEN;
  }

  // WebSocket LISTENERS

  addSocketListeners() {
    this.openHandler = this.onOpen.bind(this);
    this.socket.addEventListener('open', this.openHandler);
    this.messageHandler = this.onMessage.bind(this);
    this.socket.addEventListener('message', this.messageHandler);
    this.errorHandler = this.onError.bind(this);
    this.socket.addEventListener('error', this.errorHandler);
    this.closeHandler = this.onClose.bind(this);
    this.socket.addEventListener('close', this.closeHandler);
  }

  removeSocketListeners() {
    this.socket.removeEventListener('open', this.openHandler);
    this.socket.removeEventListener('message', this.messageHandler);
    this.socket.removeEventListener('error', this.errorHandler);
    this.socket.removeEventListener('close', this.closeHandler);
    this.socket.close();
  }

  // CALLBACKS

  onOpen(e) {
    document.body.classList.add('has-socket');
    document.body.classList.remove('no-socket');
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
    if(this.errorCallback) this.errorCallback(e);
  }

  setErrorCallback(callback) {
    this.errorCallback = callback;
  }

  onClose(e) {
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
      this.errorCallback({message:'SolidSocket.sendMessage() failed - not connected'});
      console.warn('SolidSocket.sendMessage() failed - not connected');
    }
  }

  sendJSON(data) {
    this.sendMessage(JSON.stringify(data));
  }

  // MONITORING & RECONNECTION

  startMonitoringConnection() {
    this.checkConnection();
  }

  checkConnection() {
    let socketOpen = this.isConnected();
    let socketConnecting = this.socket.readyState == WebSocket.CONNECTING;
    let timeForReconnect = Date.now() > this.lastConnectAttemptTime + SolidSocket.RECONNECT_INTERVAL;
    if(timeForReconnect) {
      this.lastConnectAttemptTime = Date.now();

      // check for disconnected socket & reinitialize if needed
      if(!socketOpen && !socketConnecting) {
        // clean up failed socket object
        this.removeSocketListeners();
        // initialize a new socket object
        try {
          this.socket = new WebSocket(this.wsURL);
          this.addSocketListeners();
        } catch(err) {
          console.log('Websocket couldn\'t connect: ', err);
        }
      }

      // add body class depending on state
      if(socketOpen) {
        document.body.classList.add('has-socket');
        document.body.classList.remove('no-socket');
        if(this.connectionActiveCallback) this.connectionActiveCallback(true);
      } else {
        document.body.classList.add('no-socket');
        document.body.classList.remove('has-socket');
        if(this.connectionActiveCallback) this.connectionActiveCallback(false);
      }
    }
    // keep checking connection
    if(this.active == true) {
      requestAnimationFrame(() => this.checkConnection());
    }
  }

  // CLEANUP

  dispose() {
    this.active = false;
    this.socket.close();
  }

}

SolidSocket.RECONNECT_INTERVAL = 2000;

export default SolidSocket;
