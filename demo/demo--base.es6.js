import DOMUtil from '../src/dom-util.es6.js';
import ErrorUtil from '../src/error-util.es6.js';
import MobileUtil from '../src/mobile-util.es6.js';
import VideoRecorder from '../src/video-recorder.es6.js';

class DemoBase {

  static loadDemo(demoJsFile=null) {
      // demos should auto-init to append to <body>
      window.autoInitDemo = true;

      // get demo name & turn into javascript include
      let demo = DemoBase.getDemoId();
      if(!demoJsFile) demoJsFile = DemoBase.demoJsFile();
      if(demoJsFile && demo.length > 1) {
        console.log("Loading demo: ", demoJsFile);
        ErrorUtil.initErrorCatching();
        DOMUtil.loadJavascript(demoJsFile, null, 'module');
      } else {
        document.location.href = '../';
      }
  }

  static getDemoId() {
    let id = (document.location.hash.indexOf('&') == -1) ? 
      document.location.hash : 
      document.location.hash.split('&')[0]; // URLUtil.getHashQueryVariable('demo');
    return id.substring(1);
  }

  static demoJsFile() {
    return `./demo-${DemoBase.getDemoId()}.es6.js?v=${Math.round(Math.random() * 9999999)}`;
  }

  constructor(parentEl, jsFiles, layoutHtmlOrTitle=null, elId=null, desc=null, fullscreen=false) {
    this.parentEl = parentEl;
    if(layoutHtmlOrTitle != null && elId == null) {
      this.buildLayout(layoutHtmlOrTitle);
    } else if(elId != null) {
      let title = layoutHtmlOrTitle;
      this.buildLayoutBasic(elId, title, desc);
      this.el = document.getElementById(elId);
      if(fullscreen) {
        this.el.classList.add('fullscreen-bg');
        MobileUtil.addFullscreenListener();
        MobileUtil.addFullscreenEl(this.el);
      }
      this.debugEl = document.getElementById('debug');
    }
    this.loadJsDependenciesSerial(jsFiles);
    this.addBackLink();
  }

  addBackLink() {
    // add back button
    let btn = document.createElement('a');
    btn.innerText = '🔙 All Demos';
    btn.setAttribute('href', '../');
    // btn.setAttribute('style', 'position: fixed; top: 0; left: 0; padding: 2rem;');
    btn.setAttribute('style', 'margin: 0 0 2rem 0; display: inline-block; background: var(--white-trans); padding: 1rem;');

    // add src link
    let srcBtn = document.createElement('a');
    srcBtn.innerText = 'Demo source';
    srcBtn.setAttribute('href', DemoBase.demoJsFile());
    srcBtn.setAttribute('target', '_blank');
    // srcBtn.setAttribute('style', 'position: fixed; top: 0; left: 0; padding: 2rem;');
    srcBtn.setAttribute('style', 'float: right; margin: 0 0 2rem 0; display: inline-block; background: var(--white-trans); padding: 1rem;');

    // add to DOM
    let container = document.querySelector('.container');
    if(!!container) {
      container.prepend(btn);
      container.prepend(srcBtn);
    }
  }

  /*
  loadJsDependencies(jsFiles) {
    if(jsFiles == null || jsFiles.length == 0) return this.init();
    this.numScripts = 0;
    this.numScriptsLoaded = 0;
    jsFiles.forEach((jsFile, i) => {
      if(jsFile.indexOf('dom-util.es6') === -1) {   // don't load dom-util since the demo html page already does
        let script = DOMUtil.loadJavascript(jsFile);
        script.addEventListener('load', () => {
          this.numScriptsLoaded++;
          console.log('Loading scripts :: ', this.numScriptsLoaded, '/', this.numScripts, jsFile);
          if(this.numScriptsLoaded == this.numScripts) {
            console.log("Loading scripts :: init()");
            this.init();
          }
        });
        this.numScripts++;
      }
    });
  }
  */

  loadJsDependenciesSerial(jsFiles) {
    if(jsFiles == null || jsFiles.length == 0) return this.init();
    this.jsFiles = jsFiles;
    this.loadNextScript();
  }

  loadNextScript() {
    if(this.jsFiles.length > 0) {
        // load from front of array
      let nextJsFile = this.jsFiles.shift();
      var moduleStatus = 'module';
      if(nextJsFile.indexOf('!') == 0) {
        nextJsFile = nextJsFile.substring(1);
        moduleStatus = null;
      }
      console.log('nextJsFile', nextJsFile);
      nextJsFile += `?v=${Math.round(Math.random() * 9999999)}`;
      DOMUtil.loadJavascript(nextJsFile, () => this.loadNextScript(), moduleStatus);
    } else {
      this.init();
    }
  }

  buildLayout(html) {
    let layoutNode = DOMUtil.stringToDomElement(html.trim());
    this.parentEl.appendChild(layoutNode);
  }

  buildLayoutBasic(elId, title, desc) {
    document.title += ` | ${title}`;
    let descTag = (!!desc) ? `<p>${desc}</p>` : '';
    this.buildLayout(`
      <div class="container">
        <h1>${title}</h1>
        ${descTag}
        <div id="${elId}"></div>
        <p id="debug"></p>
      </div>
    `);
  }

  init() {
    // please override
  }

  /////////////////////////////
  // RECORD
  /////////////////////////////

  initRecording(el, loopFrames, startFrame, extraFrames=1) {
    this.recordEl = el;
    const optionsOverride = {
      fileType: 'webm',
      audioKBPS: 320,
      videoMBPS: 20,
      callback: (aLink) => {
        aLink.setAttribute('class', 'button');
        this.el.appendChild(aLink);
      },
    };
    this.videoRecorder = new VideoRecorder(this.recordEl, optionsOverride);

    // frame recording config
    this.loopFrames = loopFrames;
    this.startFrame = startFrame + loopFrames + 1;
    this.endFrame = startFrame + loopFrames * 2 + extraFrames;
    this.numFramesRecorded = 0;
  }

  renderVideo() {
    if(!this.videoRecorder) return;
    let frameCount = _frameLoop.count();
    if(this.videoRecorder.recording()) {
      this.numFramesRecorded++;
      this.videoRecorder.addFrame(); // record frames!
    }
    if(_frameLoop.count() == this.endFrame) {
      this.videoRecorder.finish();
      console.log('VideoRecorder :: finish frame ::', frameCount);
      console.log('VideoRecorder :: total frames recorded:: ', this.numFramesRecorded);
    }
    if(frameCount == this.startFrame - 1) {
      this.videoRecorder.start();
      console.log('VideoRecorder :: start frame :: ', frameCount);
    }
  }
}

export default DemoBase;
