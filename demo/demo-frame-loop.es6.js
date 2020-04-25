class FrameLoopDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [
      "../src/frame-loop.es6.js",
    ], 'FrameLoop', 'frame-loop-container');
  }

  init() {
    this.el = document.getElementById('frame-loop-container');
    window._frameLoop = new FrameLoop(180, 4);
    _frameLoop.addListener(this);
  }

  frameLoop(frameCount) {
    this.el.innerHTML = `
      <div>frameCount = ${frameCount}</div>
      <div>frameCount = ${_frameLoop.count()}</div>
      <div>osc = ${_frameLoop.osc(0.01, 0, 100)}</div>
      <div>frameMod (200) = ${_frameLoop.frameMod(200)}</div>
      <div>frameModSeconds = ${_frameLoop.frameModSeconds(1)}</div>
      <div>getLoopFrames = ${_frameLoop.getLoopFrames()}</div>
      <div>getLoopCurFrame = ${_frameLoop.getLoopCurFrame()}</div>
      <div>getProgress = ${_frameLoop.getProgress()}</div>
      <div>getProgressRads = ${_frameLoop.getProgressRads()}</div>
      <div>getCurTick = ${_frameLoop.getCurTick()}</div>
      <div>getIsTick = ${_frameLoop.getIsTick()}</div>
    `;
  }

}

if(window.autoInitDemo) new FrameLoopDemo(document.body);
