import DemoBase from "./demo--base.js";
import DateUtil from "../src/date-util.js";
import EventLog from "../src/event-log.js";
import FrameLoop from "../src/frame-loop.js";

class BroadcastChannelDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "BroadcastChannel API (Vanilla)",
      "broadcast-channel-container",
      "Open this demo in multiple windows of the same browser to show off the cross-tab/window communication."
    );
  }

  init() {
    this.log = new EventLog(this.debugEl);

    // https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API
    // Connection to a broadcast channel
    this.bc = new BroadcastChannel("test_channel");
    this.bc.onmessage = (event) => {
      this.log.log(`${event.data}`);
      // this.log.log(`<pre>${JSON.parse(event.data).frameCount}</pre>`);
      // console.log(event);
    };

    // animate loop
    window.frameLoop = new FrameLoop();
    window.frameLoop.addListener(this);
  }

  frameLoop(frameCount) {
    if (frameCount % 100 === 0) {
      // Send some json
      let dataOut = {
        frameCount: frameCount,
        millis: DateUtil.getMillis(),
      };
      this.bc.postMessage(JSON.stringify(dataOut));
    }

    // DateUtil info
    this.el.innerHTML = `
      <div><code>getMillis</code> = ${DateUtil.getMillis()}</div>
      <div><code>getMillisFine</code> = ${DateUtil.getMillisFine()}</div>
      <div><code>getDateTimeStamp</code> = ${DateUtil.getDateTimeStamp()}</div>
      <div><code>getClockTimeStamp</code> = ${DateUtil.getClockTimeStamp()}</div>
      <div><code>getTimeStamp</code> = ${DateUtil.getTimeStamp()}</div>
    `;
  }
}

if (window.autoInitDemo) window.demo = new BroadcastChannelDemo(document.body);
