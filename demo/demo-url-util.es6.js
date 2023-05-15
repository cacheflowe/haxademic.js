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
      <div><code>window.location.href</code> = ${window.location.href}</div>
      <div><code>window.location.protocol</code> = ${window.location.protocol}</div>
      <div><code>window.location.hostname</code> = ${window.location.hostname}</div>
      <div><code>window.location.hash</code> = ${window.location.hash}</div>
      <div><code>window.location.host</code> = ${window.location.host}</div>
      <div><code>window.location.href</code> = ${window.location.href}</div>
      <div><code>window.location.search</code> = ${window.location.search}</div>
      <div><code>window.location.origin</code> = ${window.location.origin}</div>
      <div><code>window.location.ancestorOrigins</code> = ${window.location.ancestorOrigins}</div>
    `;
  }

}

if(window.autoInitDemo) window.demo = new URLUtilDemo(document.body);
