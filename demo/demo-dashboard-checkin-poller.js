import DemoBase from "./demo--base.js";
import DashboardCheckinPoller from "../src/dashboard-checkin-poller.js";

class DashboardCheckinPollerDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "DashboardCheckinPoller",
      "dashboard-checkin-poller-container"
    );
  }

  init() {
    this.dashboardCheckin = new DashboardCheckinPoller(
      "http://localhost/haxademic/www/dashboard-new/",
      "test-app-web",
      "Test Web App",
      10 * 1 * 1000
    );
    this.dashboardCheckin.successCallback(this.successCallback.bind(this));
  }

  successCallback(data) {
    console.log(data);
    this.debugEl.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
  }
}

if (window.autoInitDemo)
  window.demo = new DashboardCheckinPollerDemo(document.body);
