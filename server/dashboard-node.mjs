// install:
// - npm install screenshot-desktop
// run:
// - node dashboard-node.mjs

/////////////////////
// Imports
/////////////////////

import fs from "fs";
import path from "path";
import os from "os";
import screenshot from "screenshot-desktop";

/////////////////////
// Dashboard Config
/////////////////////

const oneMinuteMS = 60 * 1000;
const screenshotInterval = oneMinuteMS * 0.3;
const appId = "test-app-id";
const appTitle = "App Title";
const dashboardURL = "http://localhost/haxademic/www/dashboard-new/";

/////////////////////
// Globals & temp path for screenshot
/////////////////////

let startTime = Date.now();
let tmpDir = "tmp/";
let screenshotFilePath = `screenshot.jpg`;

// override temp screenshot path with proper system temp dir
await fs.mkdtemp(path.join(os.tmpdir(), `${appId}-`), (err, folder) => {
  if (err) throw err;
  tmpDir = folder;
  screenshotFilePath = `${folder}/${screenshotFilePath}`;
  initPosting();
});

/////////////////////
// Post to dashboard
/////////////////////

function buildPostData(screenshot = null) {
  let postData = {
    appId: appId,
    appTitle: appTitle,
    uptime: Math.round((Date.now() - startTime) / 1000),
    frameCount: 1,
    frameRate: 60,
    // for front-end if we add that:
    // resolution: `${window.innerWidth}x${window.innerHeight}`,
    // imageExtra: null,
  };
  if (screenshot) {
    postData.imageScreenshot = screenshot;
  }
  return JSON.stringify(postData);
}

function postToDashboard(screenshot = null) {
  fetch(dashboardURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: buildPostData(screenshot),
  })
    .then((response) => response.json())
    .then((jsonResponse) => {
      if (screenshot) deleteScreenshot();
    })
    .catch((error) => {
      console.error("Dashboard POST Error:", error);
      if (screenshot) deleteScreenshot();
    });
}

/////////////////////
// Screenshot check-in
/////////////////////

function postScreenshotCheckin() {
  screenshot({ format: "jpg", filename: screenshotFilePath })
    .then((savedImgPath) => {
      fs.readFile(savedImgPath, (err, data) => {
        let base64Img = Buffer.from(data).toString("base64");
        postToDashboard(base64Img);
      });
    })
    .catch((err) => {
      console.error("Dashboard failed to take screenshot", err);
    });
}

function deleteScreenshot() {
  fs.unlink(screenshotFilePath, (err) => {
    if (err) return console.error("Dashboard failed to delete screenshot", err);
  });
}

/////////////////////
// Set intervals
// - Screenshot heartbeat check-in less frequently
// - Non-screenshot heartbeat check-in more frequently
// - Post immediately on startup
/////////////////////

function initPosting() {
  setInterval(() => postScreenshotCheckin(), screenshotInterval);
  postScreenshotCheckin();
}
