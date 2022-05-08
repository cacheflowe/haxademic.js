import DemoBase from './demo--base.es6.js';
import URLUtil from '../src/url-util.es6.js';

class URLUtilDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [], 'URLUtil', 'url-util-container', 'Path and pushState helpers.');
  }

  init() {
    URLUtil.reloadOnHashChange();
    this.el.innerHTML = `
      <div><code>curAbsolutePath</code> = ${URLUtil.curAbsolutePath()}</div>
      <div><code>getQueryParam('param')</code> = ${URLUtil.getQueryParam('param')}</div>
      <div><code>getHashQueryParam('test')</code> = ${URLUtil.getHashQueryParam('test')}</div>
      <div><code>getHashQueryVariable('test')</code> = ${URLUtil.getHashQueryVariable('test')}</div>
    `;
  }

}

if(window.autoInitDemo) window.demo = new URLUtilDemo(document.body);
