// install:
// - npm install screenshot-desktop
// - npm install axios
// - ...or just npm install once package.json exists
// run:
// - node screenshot-test.js [--debug]

"use strict";
process.title = "node-screenshot";

/////////////////////
// Imports
/////////////////////

const fs = require("fs");
const screenshot = require("screenshot-desktop");
const axios = require("axios");

/////////////////////
// Config
/////////////////////

const heartbeatInterval = 60 * 1000 * 5;
const screenshotInterval = 60 * 1000 * 15;
const appId = "test-app-web";
const appTitle = "Test Web App";
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
  axios
    .post(dashboardURL, postData)
    .then((res) => {
      // console.log(`statusCode: ${res.status}`);
      // console.log(res);
    })
    .catch((error) => {
      console.error(error);
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
