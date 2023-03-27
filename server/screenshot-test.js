// install:
// - npm install screenshot-desktop
// run:
// - node screenshot-test.js [--debug]

/////////////////////
// Imports
/////////////////////

import fs from "fs";
import screenshot from "screenshot-desktop";

/////////////////////
// Config
/////////////////////

const heartbeatInterval = 60 * 1000 * 5;
const screenshotInterval = 60 * 1000 * 15;
const appId = "brewers-protect-the-plate";
const appTitle = "Brewers Protect the Plate";
const dashboardURL = "http://localhost/haxademic/www/dashboard-new/";

// globals
let startTime = Date.now();
const screenshotFileName = "screenshot.jpg";

/////////////////////
// post to dashboard
/////////////////////

function postToDashboard(imageScreenshot = null) {
  // build post data for dashboard
  let postData = {
    appId: appId,
    appTitle: appTitle,
    // imageExtra: null,
    uptime: Math.round((Date.now() - startTime) / 1000),
    // resolution: `${window.innerWidth}x${window.innerHeight}`,
    frameCount: 1,
    frameRate: 60,
  };
  if (imageScreenshot) {
    postData.imageScreenshot = imageScreenshot;
  }

  // post it!
  fetch(dashboardURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postData),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Success:", data);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

/////////////////////
// screenshot check-in
/////////////////////

setInterval(() => {
  screenshot({ format: "jpg", filename: screenshotFileName })
    .then((img) => {
      // img: Buffer of the image - not sure what this is
      fs.readFile(screenshotFileName, function (err, data) {
        let base64Img = Buffer.from(data).toString("base64");
        // 'data:image/jpeg;base64,' + base64Img
        postToDashboard(base64Img);
      });
    })
    .catch((err) => {
      console.error("Failed to post screenshot", err);
    });
}, screenshotInterval);

/////////////////////
// non-screenshot heartbeat check-in
/////////////////////

setInterval(() => {
  postToDashboard();
}, heartbeatInterval);
postToDashboard();
