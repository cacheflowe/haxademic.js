/*******************************************************************

# Run Chrome in kiosk mode

Notes:

- This is a Windows-only tool!
- Kiosk mode is good for user-facing touchscreens, but fullscreen mode is better for dev work, because you can still use dev tools, etc. You can also use the Broadcast Channel API to send messages between windows (kiosk mode disables this). However, sending browsers to multiple screens requires the --screen-num (--user-dir) option, which also disables the Broadcast Channel API. So, if you want to use this API, there has to be an automation workaround to auto-launch those browser windows into the right location, which could be done with keyboard automation via https://nutjs.dev/

Usage:

node run-chrome.mjs --url http://localhost:3002 --chrome "C:\\Program Files\\Chromium\\Application\\"

To launch 2 Chrome windows to different monitors:

You can specify the screen number, x, and y position for each window. Screen number doesn't send the window to a screen, 
but is needed for multipls windows to launch independently in fullscreen mode on different monitors.
To send a window to a different monitor, you need to set the x/y coordinates to open the Chrome window on that monitor,
and --fullscreen or --kiosk will launch it into fullscreen mode on that monitor, based on its location.
Screen number is only necessary if you have more than one monitor, and lets Chrome launch 2 kiosks or app windows into fullscreen 
on different monitors at the same time. Otherwise kiosk/fullscreen mode can get confused and not launch independently on each screen.

- node run-chrome.mjs --url http://localhost:3002 --location 500,100 --fullscreen true --screen-num 1 
- node run-chrome.mjs --url http://localhost:3002 --location 2500,100 --fullscreen true --screen-num 2

Required params:

`--url` - URL to open in Chrome

Optional params:

`--chrome` - Path to the Chrome executable. Needs formatting like: `C:\\Program Files\\Chromium\\Application\\`
`--kiosk` - Whether to run in kiosk mode (true/false) - most likely for a user-facing locked-down touchscreen. Defaults to false. Don't combine with ---fullscreen mode.
`--fullscreen` - Whether to launch in fullscreen. Defaults to false. Allows for exiting fullscreen mode for debugging. Don't combine with ---kiosk mode.
`--screen-num` - Required when using kiosk/fullscreen across multiple monitors. It should be set to the display number to launch the window on. This creates a Chrome user profile directory on the computer on the C: drive for each browser. This user directory lets chrome launch 2+ fullscreen/kiosk windows on separate displays at the same time, as it runs them in separate sandboxes, to a degree. 
`--address-bar` - Keeps the address bar if true. Defaults to false for a more minimal app title bar, and has no impact in kiosk mode.
`--size` - width,height of sindow Defaults to `800,600`
`--location` - x,y coordinates to launch the window at. Defaults to 0,0. Needed to place windows on different monitors. *You* need to account for display zoom wet in Windows. 
`--incognito` - Whether to disable localstorage, etc. Defaults to false. 
`--unsafe-origins` - Comma-separated list of URLs to allow in Chrome that are not secure, for getUserMedia, etc. We automatically set the main URL as an unsafe origin, so you don't need to include it in this list.
  - More info: https://www.chromium.org/Home/chromium-security/deprecating-powerful-features-on-insecure-origins/
  - If not launching in kiosk mode, this flag will trigger an infobar telling you that it's unsafe and not supported, which is not true. Though it seems that --test-type solved this rogue infobar.
`--log-displays` - Logs displays properties for debugging. Defaults to false.
`--kill-before` - Whether to kill any Chrome instances before running. Defaults to false.

*******************************************************************/

/////////////////////////////////
// Imports
/////////////////////////////////

import { exec, spawn } from "node:child_process";
import util from "util";
const execAsync = util.promisify(exec);

/////////////////////////////////
// Get relative path to data file
/////////////////////////////////

import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/////////////////////////////////
// Helpers
/////////////////////////////////

function logLine() {
  logPurple("====================================================");
}

function logBlue(text) {
  console.log("\x1b[36m%s\x1b[0m", text);
}

function logPurple(text) {
  console.log("\x1b[35m%s\x1b[0m", text);
}

function logBlueKV(key, value) {
  console.log(`${key}: \x1b[36m%s\x1b[0m`, value);
}

async function runCmd(cmd) {
  try {
    const { stdout, stderr } = await execAsync(cmd);
    return stdout;
  } catch (e) {
    console.error(e);
    return e;
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function killChrome() {
  await runCmd("taskkill /F /T /IM chrome.exe");
}

/////////////////////////////////
// Get args & set config
/////////////////////////////////

function getArg(key, defaultValue) {
  const args = process.argv.slice(2);
  const index = args.indexOf(key);
  return index != -1 ? args[index + 1] : defaultValue;
}

const url = getArg("--url", "http://localhost:3002");
const chrome = getArg("--chrome", "C:\\Program Files\\Chromium\\Application\\");
const killBefore = getArg("--kill-before", "false") === "true";
const isIncognito = getArg("--incognito", "false") === "true";
const isKiosk = getArg("--kiosk", "false") === "true";
const isFullscreen = getArg("--fullscreen", "false") === "true";
const logDisplays = getArg("--log-displays", "false") === "true";
const screenNum = getArg("--screen-num", "-1");
const addressBar = getArg("--address-bar", "false") === "true";
const location = getArg("--location", "0,0");
const windowSize = getArg("--size", "800,600");
const unsafeOrigins = getArg("--unsafe-origins", null);
const unsafeOriginsArr = unsafeOrigins
  ? unsafeOrigins.split(",").push(url) // add our main url to the list of unsafe origins if we've specified any
  : [url];
const unsafeOriginsStr = unsafeOriginsArr.join(",");

// log config
logLine();
logPurple("Config:");
logBlueKV("Starting Chrome with URL:", url);
logBlueKV("Chrome Path:", chrome);
logBlueKV("killBefore:", killBefore);
logBlueKV("isIncognito:", isIncognito);
logBlueKV("isKiosk:", isKiosk);
logBlueKV("isFullscreen:", isFullscreen);
logBlueKV("screenNum:", screenNum);
logBlueKV("addressBar:", addressBar);
logBlueKV("logDisplays:", logDisplays);
logBlueKV("location:", location);
logBlueKV("size:", windowSize);
logBlueKV("Unsafe Origins:", unsafeOriginsArr);

/////////////////////////////////
// Build chrome launch command
/////////////////////////////////

function buildChromeCommand() {
  return (
    `"${chrome}chrome.exe" ` +
    (isKiosk ? `--kiosk ` : ``) +
    (addressBar ? `` : `--app=${url} `) +
    (isFullscreen ? `--start-fullscreen ` : ``) +
    (screenNum != "-1"
      ? `--user-data-dir=c:/_chrome-kiosk-prefs/screen-${screenNum} `
      : ``) +
    `--window-position=${location} ` +
    `--window-size=${windowSize} ` +
    (isIncognito ? `--incognito ` : ``) + // incognito disables localStorage, etc.
    `--new-window ` + // if address-bar is true, don't open new chrome instance as a tab
    `--fast-start ` +
    `--no-first-run ` +
    `--disable-application-cache ` +
    `--disable-pinch ` +
    `--overscroll-history-navigation=0 ` +
    `--disable-session-crashed-bubble ` +
    `--disable-infobars ` + // no longer supported
    `--no-default-browser-check ` +
    `--allow-file-access-from-files ` +
    `--allow-running-insecure-content ` +
    `--reduce-security-for-testing ` + // might not exist anymore
    `--remember-cert-error-decisions ` +
    `--enable-chrome-browser-cloud-management ` +
    `--no-user-gesture-required ` +
    `--autoplay-policy=no-user-gesture-required ` +
    `--disable-gesture-requirement-for-presentation ` +
    `--enable-experimental-accessibility-autoclick ` +
    `--pull-to-refresh=0 ` +
    `--test-type ` + // removes the "You are using an unsupported command-line flag" warning
    `--ignore-certificate-errors ` + // disables the "are you sure you want to visit an unsecure SLL site" warning for self-signed certs
    `--ignore-urlfetcher-cert-requests ` +
    `--disable-web-security ` +
    `--disable-popup-blocking ` +
    `--disable-translate ` +
    `--disable-tab-switcher ` +
    `--use-fake-ui-for-media-stream ` + // removes need to "Allow/Block" modal for getUserMedia requests. combined with unsafely-treat-insecure-origin-as-secure to auto-init webcams, etc.
    `--unsafely-treat-insecure-origin-as-secure=${unsafeOriginsStr} ` + // allow insecure origins for getUserMedia, etc.
    `${url}`
  );
}

async function startChrome() {
  // kill chrome before starting a new instance
  if (killBefore) {
    console.warn("Killing Chrome before starting a new instance.");
    await killChrome();
    await delay(500); // Wait for 1 second to make sure Chrome is killed before starting a new instance
  }

  // start Chrome!
  const cmdStr = buildChromeCommand();
  logLine();
  logPurple("Launch command:");
  logBlue(cmdStr);
  logLine();
  runCmd(cmdStr); // this process hangs on the child process, so don't wait, and quit a moment later
  quit();
}

/////////////////////////////////
// PowerShell command to get screen resolutions
/////////////////////////////////

async function getDisplayDimensions() {
  // 2-line powershell command to get physical display properties
  const psCmd =
    'powershell.exe -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Screen]::AllScreens"';
  const lines = (await runCmd(psCmd)).split("\n");

  // break output into lines and regex out the screen resolution
  const boundsLines = lines.filter((line) => line.includes("Bounds"));
  const res = boundsLines.map((line) =>
    line.match(/Bounds\s+:\s+{X=(\d+),Y=(\d+),Width=(\d+),Height=(\d+)}/)
  );
  const screens = res.map((match) => {
    return {
      x: parseInt(match[1]),
      y: parseInt(match[2]),
      width: parseInt(match[3]),
      height: parseInt(match[4]),
    };
  });
  logLine();
  logPurple("Displays info:");
  logBlueKV("Num screens", screens.length);
  screens.forEach((screen, i) => {
    logBlueKV(`Screen [${i + 1}]`, screen);
  });

  // attempted to auto-set screenX and screenY based on displayIndex, but display zoom isn't taken into account, which means this is not reliable
  // screenX = screens[displayIndex].x;
  // screenY = screens[displayIndex].y;

  startChrome();
}

function quit() {
  setTimeout(() => {
    process.exit(0);
  }, 500);
}

/////////////////////////////////
// Init! Either get the display dimensions first, or start chrome
/////////////////////////////////

if (logDisplays) {
  getDisplayDimensions();
} else {
  startChrome();
}

/*******************************************************************
////////////////////////////////////////////////////////////////////

# Research:

- https://peter.sh/experiments/chromium-command-line-switches/
- https://www.chromium.org/developers/how-tos/run-chromium-with-flags
- https://peter.sh/experiments/chromium-command-line-switches/#kiosk
- https://stackoverflow.com/questions/40696280/unsafely-treat-insecure-origin-as-secure-flag-is-not-working-on-chrome

Prior scripts to look at for inspo:
- https://github.com/Hovercraft-Studio/rev-discover-b1g-football/blob/main/scripts/start-chrome.cmd
- https://github.com/Hovercraft-Studio/bounty-toss-game/blob/main/scripts/launch-chrome-kiosk-1.cmd
- https://github.com/Hovercraft-Studio/golden1-kings-stadium-game/blob/main/scripts/launch-tablet-ui.cmd
- https://github.com/cacheflowe/haxademic/blob/master/scripts/chrome-launch-multiple.cmd
- https://github.com/cacheflowe/haxademic/blob/master/scripts/chrome-launch-apps.cmd
- https://github.com/cacheflowe/haxademic/blob/master/scripts/chrome-app.cmd
- https://github.com/Hovercraft-Studio/bounty-toss-game/tree/main/scripts - lots of run scripts

Potentially helpful npm packages:
- Screen resolution packages:
  - https://github.com/xan105/node-win-screen-resolution
  - https://github.com/kristian/displays
  - Sginle screen only?
    - https://www.npmjs.com/package/@vamidicreations/screenres
    - https://github.com/octalmage/robotjs
    - https://github.com/ariya/phantomjs
      - https://stackoverflow.com/a/22075949
    - https://github.com/Richienb/screenz
- App window management packages:
  - https://www.npmjs.com/package/windows-window-controller
  - https://github.com/nut-tree/nut.js (Desktop automation)
    - https://nutjs.dev/tutorials/window
  - https://github.com/sindresorhus/get-windows (Retrieve info about all open windows - read only)
    - https://github.com/sindresorhus/windows-cli - underlying tool for get-windows
- https://github.com/sindresorhus/execa (help running shell commands/scripts)
- Shell commands for displays:
  - https://devblogs.microsoft.com/scripting/use-powershell-to-discover-multi-monitor-information/
    - Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorBasicDisplayParams
  - https://serverfault.com/a/1160782
    - Add-Type -AssemblyName System.Windows.Forms
    - [System.Windows.Forms.Screen]::AllScreens
  - https://www.nirsoft.net/utils/multi_monitor_tool.html


////////////////////////////////////////////////////////////////////
*******************************************************************/
