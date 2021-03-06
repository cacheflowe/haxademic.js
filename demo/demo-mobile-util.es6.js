import DemoBase from './demo--base.es6.js';
import MobileUtil from '../src/mobile-util.es6.js';

class MobileUtilDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [], `
    <div class="container" style="padding-bottom: 500px">
      <style>
        body.mobile .is-mobile,
        body.desktop .is-desktop {
          color: #090;
        }
        button:active {
          background-color: #090;
        }
        #fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          border: 5px solid #0f0;
          pointer-events: none;
        }
        #fullscreen-top,
        #fullscreen-bottom {
          position: absolute;
          top: 0;
          left: 0;
          width: 40px;
          height: 40px;
          background-color: #f00;
        }
        #fullscreen-bottom {
          background-color: #00f;
          top: auto;
          bottom: 0;
        }
      </style>
      <h1>MobileUtil</h1>
      <div id="info"></div>
    </div>`);
  }

  init() {
    this.initButtons();
    this.buildDisplay();

    MobileUtil.setDeviceInputClass();
    MobileUtil.enablePseudoStyles();
    MobileUtil.addFullscreenListener();
    MobileUtil.addFullscreenEl(document.getElementById('fullscreen'), true);
  }

  initButtons() {
    this.el = document.querySelector('.container');
    this.el.addEventListener('click', (e) => {
      if(e.target.id == "buttonLock")     MobileUtil.lockTouchScreen(true);
      if(e.target.id == "buttonUnlock")   MobileUtil.lockTouchScreen(false);
    });
  }

  buildDisplay() {
    this.el = document.getElementById('info');
    this.el.innerHTML = `
      <div><code>setDeviceInputClass()</code> <span class="is-mobile">.mobile</span> | <span class="is-desktop">.desktop</span></div>
      <div><code>enablePseudoStyles()</code> :active ready!</div>
      <div><code>isMobileBrowser()</code> = ${MobileUtil.isMobileBrowser()}</div>
      <div><code>isIOS()</code> = ${MobileUtil.isIOS()}</div>
      <div><code>isIPhone()</code> = ${MobileUtil.isIPhone()}</div>
      <div><code>isAndroid()</code> = ${MobileUtil.isAndroid()}</div>
      <div><code>isSafari()</code> = ${MobileUtil.isSafari()}</div>
      <div><code>isIE11()</code> = ${MobileUtil.isIE11()}</div>
      <button id="buttonLock">lockTouchScreen(true)</button>
      <button id="buttonUnlock">lockTouchScreen(false)</button>
      <div id="fullscreen">
        <div id="fullscreen-top"></div>
        <div id="fullscreen-bottom"></div>
      </div>
    `;
  }

}

if(window.autoInitDemo) window.demo = new MobileUtilDemo(document.body);
