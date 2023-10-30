export const postToDashboard = () => {
  /////////////////////
  // Globals
  /////////////////////

  const oneMinuteMS = 60 * 1000;
  const heartbeatInterval = oneMinuteMS * 5;
  const appId = "test-app-id";
  const appTitle = "App Title";
  const dashboardURL = "http://localhost/haxademic/www/dashboard-new/";
  let startTime = Date.now();

  /////////////////////
  // Post to dashboard
  /////////////////////

  function buildPostData() {
    let postData = {
      appId: appId,
      appTitle: appTitle,
      uptime: Math.round((Date.now() - startTime) / 1000),
      frameCount: 1,
      frameRate: 60,
      // front-end specific props:
      resolution: `${window.innerWidth}x${window.innerHeight}`,
      // imageExtra: null,
    };
    return JSON.stringify(postData);
  }

  function doFetch() {
    fetch(dashboardURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      referrerPolicy: "unsafe-url",
      crossorigin: true,
      mode: "no-cors",
      body: buildPostData(),
    })
      .then((response) => response.text())
      .then((jsonResponse) => {
        // console.log(jsonResponse);
      })
      .catch((error) => {
        console.warn("Dashboard POST Error:", error);
      });
  }

  /////////////////////
  // Set intervals
  // - Non-screenshot heartbeat check-in more frequently
  /////////////////////
  if (window.dashboardInterval) clearInterval(window.dashboardInterval);
  window.dashboardInterval = setInterval(() => doFetch(), heartbeatInterval);
  doFetch();

  return window.dashboardInterval;
};
