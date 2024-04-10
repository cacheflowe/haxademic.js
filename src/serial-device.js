class SerialDevice {
  // info:
  // - https://web.dev/serial/
  // - https://codelabs.developers.google.com/codelabs/web-serial/#0
  // Arduino code:
  // inputs:
  // - https://github.com/cacheflowe/haxademic/blob/master/arduino/VL53L0X/VL53L0X.ino
  // - https://github.com/cacheflowe/haxademic/blob/master/arduino/VL53L1X/VL53L1X.ino
  // inputs & outputs:
  // - https://github.com/cacheflowe/haxademic/blob/master/arduino/PiezoBuzzerSerialRead/PiezoBuzzerSerialRead.ino

  constructor(baudRate = 115200, readCallback = null, errorCallback = null) {
    this.baudRate = baudRate;
    this.readCallback = readCallback;
    this.errorCallback = errorCallback;
    this.initSerial();
  }

  async initSerial() {
    try {
      this.port = await navigator.serial.requestPort(); // Request a port and open a connection.
      await this.port.open({
        baudrate: this.baudRate,
        baudRate: this.baudRate,
      }); // Wait for the port to open. Use new & old `baudrate` key for different browsers
      console.log(this.port);
      this.initialized = true;
    } catch (err) {
      if (this.errorCallback) this.errorCallback(err);
      return;
    }
    // start reading input
    this.startWriting();
    this.startReading();
  }

  async startReading() {
    // input from serial device
    this.decoder = new TextDecoderStream();
    let inputDone = this.port.readable.pipeTo(this.decoder.writable);
    // this.inputStream = this.decoder.readable;  // this works, but we want to split input by line, so we switched to the next line
    this.inputStream = this.decoder.readable.pipeThrough(
      new TransformStream(new LineBreakTransformer())
    );
    this.reader = this.inputStream.getReader();
    this.readLoop();
  }

  async readLoop() {
    while (true) {
      const { value, done } = await this.reader.read();
      if (value) {
        if (this.readCallback) this.readCallback(value);
      }
      if (done) {
        console.log("[readLoop] DONE", done);
        this.reader.releaseLock();
        break;
      }
    }
  }

  async startWriting() {
    // output to serial device
    this.encoder = new TextEncoderStream();
    this.outputDone = this.encoder.readable.pipeTo(this.port.writable);
    this.writerString = this.encoder.writable.getWriter();
    // attempt to write both data or string... can't use them both yet
    // this.writerData = this.port.writable.getWriter();
  }

  // async writeDataArray(data) {
  //   if (this.port && this.port.writable) {
  //     // const data = [104, 101, 108, 108, 111]); // hello
  //     this.writerData.write(new Uint8Array(data));
  //   } else {
  //     console.log("[SerialDevice can't write data]", data);
  //   }
  // }

  async writeString(data) {
    if (this.port && this.port.writable) {
      await this.writerString.write(data);
    } else {
      console.log("[SerialDevice can't write string]", data);
    }
  }
}

class LineBreakTransformer {
  constructor() {
    // A container for holding stream data until a new line.
    this.container = "";
  }

  transform(chunk, controller) {
    this.container += chunk;
    const lines = this.container.split("\r\n");
    this.container = lines.pop();
    lines.forEach((line) => controller.enqueue(line));
  }

  flush(controller) {
    controller.enqueue(this.container);
  }
}

export default SerialDevice;
