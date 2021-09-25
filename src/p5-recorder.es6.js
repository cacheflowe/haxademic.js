import VideoRecorder from 'https://cacheflowe.github.io/haxademic.js/src/video-recorder.es6.js';

class p5Recorder {
  constructor(loopFrames) {
    // grab main p5js canvas
    this.recordEl = select('canvas').elt;
    // set up options for VideoRecorder object
    const optionsOverride = {
      fileType: 'webm',
      audioKBPS: 320,
      videoMBPS: 20,
      callback: (aLink) => {
        aLink.setAttribute('class', 'button');
        this.recordEl.parentNode.appendChild(aLink);
      },
    };
    this.videoRecorder = new VideoRecorder(this.recordEl, optionsOverride);

    // frame recording config
    this.loopFrames = loopFrames;
    this.startFrame = loopFrames + 1;
    this.endFrame = loopFrames * 2 + 1;
    this.numFramesRecorded = 0;
  }

  renderVideo() {
    if(frameCount == this.startFrame) {
      this.videoRecorder.start();
      console.log('p5Recorder :: start frame :: ', frameCount);
    }
    if(this.videoRecorder.recording()) {
      this.numFramesRecorded++;
      this.videoRecorder.addFrame(); // record frames!
    }
    if(frameCount == this.endFrame) {
      this.videoRecorder.finish();
      console.log('p5Recorder :: finish frame ::', frameCount);
      console.log('p5Recorder :: total frames recorded:: ', this.numFramesRecorded);
    }
  }
}

// set class on window since this gets imported into editor.p5js.org, not as a module
window.p5Recorder = p5Recorder;

////////////////////////////////////////////////
// loop-tracking & video recording function 
////////////////////////////////////////////////

var recorder = null;

function updateLoopRecording() {
  if(!recorder) recorder = new p5Recorder(loopFrames);
  // create a looped framecount & normalized progress
  frameCountLooped = frameCount % loopFrames;
  loopProgress = frameCountLooped / loopFrames;
  loopProgressRadians = loopProgress * TWO_PI;
  // start/stop recording, and progress
  if(!!recorder) {
    recorder.renderVideo();
  }
}