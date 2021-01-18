import DemoBase from './demo--base.es6.js';
import FrameLoop from '../src/frame-loop.es6.js';

class FrameLoopDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [], 'FrameLoop', 'frame-loop-container');
  }

  init() {
    window._frameLoop = new FrameLoop(180, 4);
    _frameLoop.addListener(this);
  }

  frameLoop(frameCount) {
    this.el.innerHTML = `
      <div><code>frameCount</code> = ${frameCount}</div>
      <div><code>frameCount</code> = ${_frameLoop.count()}</div>
      <div><code>osc</code> = ${_frameLoop.osc(0.01, 0, 100)}</div>
      <div><code>frameMod</code> (200) = ${_frameLoop.frameMod(200)}</div>
      <div><code>frameModSeconds</code> = ${_frameLoop.frameModSeconds(1)}</div>
      <div><code>getLoopFrames</code> = ${_frameLoop.getLoopFrames()}</div>
      <div><code>getLoopCurFrame</code> = ${_frameLoop.getLoopCurFrame()}</div>
      <div><code>getProgress</code> = ${_frameLoop.getProgress()}</div>
      <div><code>getProgressRads</code> = ${_frameLoop.getProgressRads()}</div>
      <div><code>getCurTick</code> = ${_frameLoop.getCurTick()}</div>
      <div><code>getIsTick</code> = ${_frameLoop.getIsTick()}</div>
    `;
  }

}

if(window.autoInitDemo) window.demo = new FrameLoopDemo(document.body);
