import DemoBase from "./demo--base.js";
import KeyboardUtil from "../src/keyboard-util.js";

class FetchNetBooterDemo extends DemoBase {
  constructor(parentEl) {
    super(parentEl, [], "Fetch | NetBooter", "fetch-netbooter-container");
  }

  init() {
    KeyboardUtil.addKeyListener((e) => {
      this.debugEl.innerHTML = `
        <code>e.key</code>: <code>${e.key}</code><br>
        <code>e.keyCode</code>: <code>${e.keyCode}</code> (deprecated)<br>
        <code>e.code</code>: <code>${e.code}</code><br>
        <code>e.shiftKey</code>: <code>${e.shiftKey}</code><br>
      `;
    });
    KeyboardUtil.addSingleKeyListener("b", (e) => {
      this.toggle();
      this.debugEl.innerHTML = `Outlet 1 on`;
    });
  }

  toggle(outlet, on) {
    // toggle 1: "cmd.cgi?rly=0"
    // toggle 2: "cmd.cgi?rly=1"
    // reboot 1: "cmd.cgi?rb=0"
    // reboot 2: "cmd.cgi?rb=1"
    // status 2: "status.xml"
    const ipAddress = "192.168.1.100";
    const username = "admin";
    const password = "admin";
    const baseURLwithPass =
      "http://" + username + ":" + password + "@" + ipAddress + "/";
    const cmd = "cmd.cgi?rly=0";

    const baseURL = "http://" + ipAddress + "/";
    var headers = new Headers();
    headers.set("Authorization", "Basic " + btoa(username + ":" + password));

    /*
    fetch(baseURL + cmd, {
      headers: headers, 
      mode: 'no-cors',
      'Access-Control-Allow-Origin': '*'
    })
    .then(response => response.text())
    .then(data => {
      console.log('fetch returned', data);
    });
    */

    const request = new Request(baseURL, {
      mode: "no-cors",
      headers: headers,
    });
    fetch(request).then((response) => {
      // cache.put(request, response)
      console.log("fetch completed", response);
    });

    // let img = new Image();
    // img.src = baseURLwithPass;

    /*
    int rly0Index = responseText.indexOf("<rly0>");
		int rly1Index = responseText.indexOf("<rly1>");
		String status1 = responseText.substring(rly0Index + 6, rly0Index + 7);
		String status2 = responseText.substring(rly1Index + 6, rly1Index + 7);
		onStatus1 = status1.equals("1");
		onStatus2 = status2.equals("1");
    */
  }
}

if (window.autoInitDemo) window.demo = new FetchNetBooterDemo(document.body);
