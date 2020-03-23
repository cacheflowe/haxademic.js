class GATracking {

  constructor(gaID=null, debug=false) {
    if(gaID != null) {
      if(gaID.indexOf('UA-') != -1) console.warn('Please only use the numeric GA tracking id');
      let debugScript = (debug) ? '_debug' : '';
      // https://developers.google.com/analytics/devguides/collection/analyticsjs/
      (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
      (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
      m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
      })(window,document,'script','https://www.google-analytics.com/analytics'+debugScript+'.js','ga');
      if(debug) window.ga_debug = {trace: true};
      ga('create', `UA-${gaID}`, 'auto');
      ga('send', 'pageview');
    }
  }

  event(category='test', action='click', label=null, value=null) {
    // More info: https://developers.google.com/analytics/devguides/collection/analyticsjs/events
    window.ga('send', 'event', category, action, label, value);
  }

  page(path=document.location.pathname) {
    // More info: https://developers.google.com/analytics/devguides/collection/analyticsjs/pages
    // More info: https://developers.google.com/analytics/devguides/collection/analyticsjs/single-page-applications
    window.ga('set', 'page', path); // sets the page for a single-page app, so subsequent events are tracked to this page
    window.ga('send', 'pageview');
  }

}
