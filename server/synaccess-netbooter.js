// install:
// - npm install axios
// - ...or just npm install once package.json exists
// run:
// - node syanccess-netbooter.js [--debug]


// NOTES
// - Check out the device admin page at 192.168.1.100 - user/pass: admin/admin

"use strict";
process.title = 'netbooter';

/////////////////////
// Imports
/////////////////////

const axios = require('axios');

/////////////////////
// Networked PDU interface
/////////////////////

// connection config
const ipAddress = '192.168.1.101';
const username = 'nike';
const password = 'nike';
const baseURLwithPass = "http://"+username+":"+password+"@"+ipAddress+"/";

// netbooter API commands
const CMD_STATUS = "status.xml";
const CMD_TOGGLE_1 = "cmd.cgi?rly=0";
const CMD_TOGGLE_2 = "cmd.cgi?rly=1";
const CMD_REBOOT_1 = "cmd.cgi?rb=0";
const CMD_REBOOT_2 = "cmd.cgi?rb=1";

// state
var outlet1On = false;
var outlet2On = false;

///////////////////////////
// "Public" methods
///////////////////////////

async function turn1On() {
  await sendCMD(CMD_STATUS);
  if (outlet1On == false) sendCMD(CMD_TOGGLE_1);
}

async function turn1Off() {
  await sendCMD(CMD_STATUS);
  if (outlet1On == true) sendCMD(CMD_TOGGLE_1);
}

async function turn2On() {
  await sendCMD(CMD_STATUS);
  if (outlet2On == false) sendCMD(CMD_TOGGLE_2);
}

async function turn2Off() {
  await sendCMD(CMD_STATUS);
  if (outlet2On == true) sendCMD(CMD_TOGGLE_2);
}

///////////////////////////
// "Internal" API commands to get/set PDU state
///////////////////////////

async function sendCMD(cmd) {
  // console.log('Sending command: ', baseURLwithPass + cmd);
  // var headers = new Headers();
  // headers.set('Authorization', 'Basic ' + btoa(username + ':' + password));
  await axios
    .post(baseURLwithPass + cmd, {}, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(username + ':' + password).toString('base64')
      }
    })
    .then(res => {
      // console.log(`statusCode: ${res.status}`)
      if(cmd == CMD_STATUS) handleStatus(res.data);
    })
    .catch(error => {
      console.error(error)
    })
    .then(function () {
      // console.error("DONE!")
    });
}

function handleStatus(responseText) {
  // pull state from config.xml
  let rly0Index = responseText.indexOf("<rly0>");
  let rly1Index = responseText.indexOf("<rly1>");
  let status1 = responseText.substring(rly0Index + 6, rly0Index + 7);
  let status2 = responseText.substring(rly1Index + 6, rly1Index + 7);
  outlet1On = status1 == "1";
  outlet2On = status2 == "1";
  // console.log(`Status: ${outlet1On}, ${outlet2On}`);
}

///////////////////////////
// Toggle commands!
///////////////////////////

let portOneOn = true;
if(portOneOn) {
  turn1On();
  turn2Off();
} else {
  turn2On();
turn1Off();
}