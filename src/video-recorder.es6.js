class VideoRecorder {

  // refactored from original code https://github.com/dmnsgn/canvas-record
  // Uses es6 options/override method: https://gist.github.com/ericelliott/f3c2a53a1d4100539f71
  // see also: https://w3c.github.io/mediacapture-fromelement/#dom-htmlmediaelement-capturestream
  // and: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/MediaRecorder
  // more here: https://mozdevs.github.io/MediaRecorder-examples/

  constructor(canvas, {
      fileType = 'mkv',   // can choose `webm` too, but mkv has higher quality output potential. mp4 doesn't seem supported yet
      frameRate = 0,      // frameRate of zero allows us to manually add frames on rAf loop
      audioKBPS = 128,    // 128kbps
      videoMBPS = 20,     // 20mbps
      callback = null
    } = {}) {
    // store options
    this.canvas = canvas;
    this.fileType = fileType;
    this.frameRate = frameRate;
    this.audioBitsPerSecond = audioKBPS * 1000;
    this.videoBitsPerSecond = videoMBPS * 1000000;
    this.callback = callback;

    // get mimtype from file extension
    const mimeTypes = {
      mkv: 'video/x-matroska;codecs=avc1',
      mp4: 'video/mp4', 
      webm: 'video/webm',
    };
    this.mimeType = mimeTypes[fileType];

    // prep recording
    this.setFileName();
    this.createRecorder();
    this.isRecording = false;
  }

  // set filename & mimetype

  setFileName() {
    // generate filename from timestamp
    const date = new Date();
    this.filename = `export-${date.toISOString().slice(0, 10)}-at-${date
      .toTimeString()
      .slice(0, 8)
      .replace(/:/g, ".")}.${this.fileType}`;
  }

  // recording state

  recording() {
    return this.isRecording;
  }

  start() {
    console.log('- VideoRecorder started -----------');
    console.log('- fileType:', this.fileType);
    console.log('- fps:', this.frameRate);
    console.log('- audioBitsPerSecond:', this.audioBitsPerSecond);
    console.log('- videoBitsPerSecond:', this.videoBitsPerSecond);
    console.log('-----------------------------------');
    this.isRecording = true;
    this.recorder.start();
  }

  addFrame() {
    if(this.isRecording) {
      this.stream.getVideoTracks()[0].requestFrame();
    }
  }

  finish() {
    this.isRecording = false;
    this.recorder.stop();
    return this.chunks;
  }

  createDownloadLink() {
    this.link = document.createElement("a");
    this.link.download = this.filename;
    this.link.textContent = 'Download video';
  }

  createRecorder() {
    this.chunks = [];
    this.stream = this.canvas.captureStream(this.frameRate);

    this.recorder = new MediaRecorder(this.stream, {
      mimeType: this.mimeType,
      audioBitsPerSecond: this.audioBitsPerSecond,
      videoBitsPerSecond: this.videoBitsPerSecond,
    });
    this.recorder.ondataavailable = (event) => {
      event.data.size && this.chunks.push(event.data);
    };
    this.recorder.onstop = (event) => {
      if (this.chunks.length) {
        // set recorded blob on <a> tag for download
        this.createDownloadLink();
        const blob = new Blob(this.chunks, { type: this.mimeType });
        this.link.href = URL.createObjectURL(blob);

        // auto download or pass back <a> tag if we want a manual download
        if(this.callback == null) {  // auto-download if no callback
          const clickEvent = new MouseEvent("click");
          this.link.dispatchEvent(clickEvent);
        } else {
          this.callback(this.link);
        }
      }
    };
  }
}