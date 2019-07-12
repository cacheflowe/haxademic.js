/////////////////////////////////////////////
// DOM tests
/////////////////////////////////////////////

// header
mainEl.appendChild(DOMUtil.stringToDomElement("<h1>UserInteractionTimeout</h1>"));

// add label element to DOM
insertHtmlStr(`<span class="user-interaction-timeout-log"></span>`);
let userInteractionTimeoutEl = document.querySelector('.user-interaction-timeout-log');

// init object, insert results into html element
new UserInteractionTimeout(document.body, 3000, function() {
  userInteractionTimeoutEl.innerHTML = "timeout complete: " + Date.now();
}, function() {
  userInteractionTimeoutEl.innerHTML = "interaction: " + Date.now();
});

// break
insertHtmlStr('<hr/>');

/////////////////////////////////////////////
// Unit tests
/////////////////////////////////////////////
