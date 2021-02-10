class URLUtil {

  static getHashQueryVariable(variable) {
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
