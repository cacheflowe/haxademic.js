class SerialDevice {

  constructor(baudRate=115200, readCallback=null, errorCallback=null) {
    this.baudRate = baudRate;
    this.readCallback = readCallback;
    this.errorCallback = errorCallback;
    this.initSerial();
  }

  async initSerial() {
    try {
      this.port = await navigator.serial.requestPort();   // Request a port and open a connection.
      await this.port.open({baudrate: this.baudRate, baudRate: this.baudRate});         // Wait for the port to open. Use new & old `baudrate` key for different browsers
    } catch(err) {
      if(this.errorCallback) this.errorCallback(err);
      return;
    }
    // start reading input
    this.connect();
  }

  async connect() {
    this.decoder = new TextDecoderStream();
    let inputDone = this.port.readable.pipeTo(this.decoder.writable);
    this.inputStream = this.decoder.readable;
    this.reader = this.inputStream.getReader();
    this.readLoop();
  }

  async readLoop() {
    while (true) {
      const { value, done } = await this.reader.read();
      if (value) {
        if(this.readCallback) this.readCallback(value);
      }
      if (done) {
        console.log('[readLoop] DONE', done);
        this.reader.releaseLock();
        break;
      }
    }
  }

}
