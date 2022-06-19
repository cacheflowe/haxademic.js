class DashboardCheckinPoller {

  constructor(dashboardURL, appId, appTitle, interval) {
    this.dashboardURL = dashboardURL;
    this.appId = appId;
    this.appTitle = appTitle;
    this.startTime = Date.now();
    this.restartInterval(interval);
    this.loadJson();  // check in on init
  }

  restartInterval(interval) {
    let checkinInterval = interval;
    if(checkinInterval > 1) {
      window.clearInterval(this.interval);
      this.interval = setInterval(() => {
        this.loadJson();
      }, checkinInterval);
    }
  }

  loadJson() {
    fetch(this.dashboardURL, {
      method: 'POST',
      body: JSON.stringify({
        appId: this.appId,
        appTitle: this.appTitle,
        uptime: Math.round((Date.now() - this.startTime) / 1000),
        resolution: `${window.innerWidth}x${window.innerHeight}`,
        frameCount: 1,
        frameRate: 60,
        imageScreenshot: null,
        imageExtra: null,
      })
    })
      .then((response) => {
        return response.json();
      }).then((jsonData) => {
        if(this.callback) this.callback(jsonData);
      }).catch(error => {
        console.warn('Checkin failed:', JSON.stringify(error));
      });
  }

  successCallback(callback) {
    this.callback = callback;
  }

}

export default DashboardCheckinPoller;
