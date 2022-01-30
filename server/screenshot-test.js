// install:
// - npm install screenshot-desktop
// - npm install axios
// - ...or just npm install once package.json exists
// run:
// - node screenshot-test.js [--debug]

"use strict";
process.title = 'node-screenshot';

/////////////////////
// Imports
/////////////////////

const fs = require('fs');
const screenshot = require('screenshot-desktop');
const axios = require('axios');

/////////////////////
// Config
/////////////////////

function bigLog(msg) {
  console.log('===================================');
  console.log('\x1b[42m%s\x1b[0m', msg);
  console.log('===================================');
}

/////////////////////
// Screenshot
/////////////////////


function sendToDashboard(imageScreenshot) {
  axios
    .post('http://localhost/haxademic/www/dashboard-new/', {
      appId: 'test-app-web',
      appTitle: "Test Web App",
      imageScreenshot: imageScreenshot,
      imageExtra: null,
      // uptime: Math.round((Date.now() - this.startTime) / 1000),
      // resolution: `${window.innerWidth}x${window.innerHeight}`,
      // frameCount: 1,
      // frameRate: 60,
    })
    .then(res => {
      console.log(`statusCode: ${res.status}`)
      console.log(res)
    })
    .catch(error => {
      console.error(error)
    })
}

screenshot({format: 'jpg', filename: 'shot.jpg'}).then((img) => {
  // img: Buffer of the image - not sure what this is
  fs.readFile('shot.jpg', function(err, data) {
    let base64Img = Buffer.from(data).toString('base64');
    // 'data:image/jpeg;base64,' + base64Img
    sendToDashboard(base64Img);
  });
}).catch((err) => {
  // ...
})
