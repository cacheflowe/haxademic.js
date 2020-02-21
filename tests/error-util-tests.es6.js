/////////////////////////////////////////////
// DOM tests
/////////////////////////////////////////////

// header
mainEl.appendChild(DOMUtil.stringToDomElement("<h1>ErrorUtil</h1>"));

// add log element & button to DOM
var errorUtilMarkup = `
  <span class="error-util-log"></span>
  <br>
  <button class="error-util-throw">Throw an Error</button>
  <br>
  <button class="error-util-custom">Custom Error</button>
`;
insertHtmlStr(errorUtilMarkup);
let errorUtilLogEl = document.querySelector('.error-util-log');
let errorUtilTriggerButton = document.querySelector('.error-util-throw');
let errorUtilCustomButton = document.querySelector('.error-util-custom');

// init error listening
ErrorUtil.initErrorCatching();

// make a button that throws errors and exception
errorUtilTriggerButton.addEventListener('click', function(e) {
  let obj = null;
  obj.doSomething();
});

// make a button that throws a custom error message, in lieu of an actual error
errorUtilCustomButton.addEventListener('click', function(e) {
  ErrorUtil.showError("Something Broke!");
});

// break
insertHtmlStr('<hr/>');

/////////////////////////////////////////////
// Unit tests
/////////////////////////////////////////////
