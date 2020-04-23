class DemoBase {

  constructor(parentEl, jsFiles, layoutHtml=null, elId=null) {
    this.parentEl = parentEl;
    this.loadJsDependenciesSerial(jsFiles);
    if(layoutHtml != null && elId == null) {
      this.buildLayout(layoutHtml);
    } else if(elId != null) {
      this.buildLayoutBasic(layoutHtml, elId);
    }
  }

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

  loadJsDependenciesSerial(jsFiles) {
    if(jsFiles == null || jsFiles.length == 0) return this.init();
    this.jsFiles = jsFiles;
    this.loadNextScript();
  }

  loadNextScript() {
    if(this.jsFiles.length > 0) {
      let nextJsFile = this.jsFiles.shift();
      if(nextJsFile.indexOf('dom-util.es6') != -1) {  // don't reload dom-util (TODO: check any others that might overlap)
        this.loadNextScript();
      } else {
        let script = DOMUtil.loadJavascript(nextJsFile);  // load from front of array
        script.addEventListener('load', () => {
          this.loadNextScript();
        });
      }
    } else {
      this.init();
    }
  }

  buildLayout(html) {
    let layoutNode = DOMUtil.stringToDomElement(html.trim());
    this.parentEl.appendChild(layoutNode);
  }

  buildLayoutBasic(title, elId) {
    this.buildLayout(`
      <div class="container">
        <h1>${title}</h1>
        <div id="${elId}"></div>
      </div>
    `);
  }

  init() {
    // please override
  }

}
