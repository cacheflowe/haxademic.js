import DemoBase from "./demo--base.es6.js";
import DateUtil from "../src/date-util.es6.js";
import FrameLoop from "../src/frame-loop.es6.js";

class DateUtilDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "DateUtil",
      "date-util-container",
      "Date and time utilities"
    );
  }

  init() {
    // animate loop
    window.frameLoop = new FrameLoop();
    window.frameLoop.addListener(this);
  }

  frameLoop(frameCount) {
    this.el.innerHTML = `
      <div><code>getMillis</code> = ${DateUtil.getMillis()}</div>
      <div><code>getMillisFine</code> = ${DateUtil.getMillisFine()}</div>
      <div><code>getDateTimeStamp</code> = ${DateUtil.getDateTimeStamp()}</div>
      <div><code>getClockTimeStamp</code> = ${DateUtil.getClockTimeStamp()}</div>
      <div><code>getTimeStamp</code> = ${DateUtil.getTimeStamp()}</div>
    `;
  }
}

if (window.autoInitDemo) window.demo = new DateUtilDemo(document.body);
