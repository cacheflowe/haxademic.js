class Cookie {

  static createCookie(key,value,days) {
    if (days) {
      var date = new Date();
      date.setTime(date.getTime()+(days*24*60*60*1000));
      var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = key+"="+value+expires+"; path=/";
  }

  static readCookie(key) {
    var keyEQ = key + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
      var c = ca[i];
      while (c.charAt(0)==' ') c = c.substring(1,c.length);
      if (c.indexOf(keyEQ) == 0) return c.substring(keyEQ.length,c.length);
    }
    return null;
  }

  static eraseCookie(key) {
    Cookie.createCookie(key,"",-1);
  }

}
