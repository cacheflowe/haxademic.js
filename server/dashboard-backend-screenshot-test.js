// install:
// - npm install screenshot-desktop
// run:
// - node screenshot-test.mjs

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
const heartbeatInterval = oneMinuteMS * 5;
const screenshotInterval = oneMinuteMS * 15;
const appId = "example-project";
const appTitle = "Example Project";
const dashboardURL = "http://localhost/haxademic/www/dashboard-new/";

// globals

let startTime = Date.now();
let tmpDir = "tmp/";
let screenshotFilePath = `screenshot.jpg`;

// override with proper system temp dir
await fs.mkdtemp(path.join(os.tmpdir(), "example-project-"), (err, folder) => {
  if (err) throw err;
  tmpDir = folder;
  screenshotFilePath = `${folder}/${screenshotFilePath}`;
});

/////////////////////
// post to dashboard
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
    .then((data) => {
      // console.log("Success:", data);
      if (screenshot) deleteScreenshot();
    })
    .catch((error) => {
      console.error("Error:", error);
      if (screenshot) deleteScreenshot();
    });
}

/////////////////////
// Screenshot check-in
/////////////////////

function postScreenshotCheckin() {
  screenshot({ format: "jpg", filename: screenshotFilePath })
    .then((img) => {
      fs.readFile(screenshotFilePath, (err, data) => {
        let base64Img = Buffer.from(data).toString("base64");
        postToDashboard(base64Img);
      });
    })
    .catch((err) => {
      console.error("Failed to post screenshot", err);
    });
}

function deleteScreenshot() {
  fs.unlink(screenshotFilePath, (err) => {
    if (err) return console.error(err);
  });
}

function listFilesInDir(dir) {
  fs.readdir(dir, function (err, files) {
    if (err) {
      return console.log("Unable to scan directory: " + err);
    } else {
      console.log("Listing files in", tmpDir, files.length);
      if (files && files.length) {
        files.forEach((file) => console.log("-", file));
      } else {
        console.log("No files found");
      }
    }
  });
}

/////////////////////
// Set intervals
// - Screenshot heartbeat check-in less frequently
// - Non-screenshot heartbeat check-in more frequently
// - Post immediately on startup
/////////////////////

setInterval(() => postScreenshotCheckin(), screenshotInterval);
setInterval(() => postToDashboard(), heartbeatInterval);
postToDashboard();
