class URLUtil {

  static getHashQueryVariable(variable) {
    // should be deprecated - newer style below: getHashQueryParam()
    var query = decodeURIComponent(window.location.hash.substring(1)); // decode in case of it being encoded
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split('=');
      if (decodeURIComponent(pair[0]) == variable) {
        return decodeURIComponent(pair[1]);
      }
    }
    return null;
  }

  static getQueryParam(variable) {
    const url = new URL(document.location); 
    for (let [key, value] of url.searchParams) {
      if(key == variable) return value;
    }
    return null;
  }

  static getHashQueryParam(variable) {
    const url = new URL(document.location); 
    const searchParams = new URLSearchParams(url.hash);
    for (let [key, value] of searchParams) {
      if(key == variable) return value;
    }
    return null;
  }

  static curAbsolutePath() {
    return window.location.protocol + window.location.hostname + window.location.pathname;
  }

  static removeHash() {
    history.pushState("", document.title, window.location.pathname + window.location.search);
  }

  static reloadOnHashChange() {
    window.addEventListener('popstate', () => document.location.reload());
  }

  static setLocalhost() {
    if(window.location.href.match('localhost')) {
      document.body.classList.add('localhost');
    }
  }

}

export default URLUtil;
