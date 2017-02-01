/////////////////////////////////////////////
// DOM tests
/////////////////////////////////////////////

// header
mainEl.appendChild(DOMUtil.stringToDomElement("<h1>EaseToValueCallback</h1>"));

// add label element to DOM
insertHtmlStr(`<code>EaseToValueCallback.setTarget()</code> <span class="eased-number-display"></span>`);
const easedNumberDisplayEl = document.querySelector('.eased-number-display');

// init easing callback object
const easedNumber = new EaseToValueCallback(0, 10, (value) => {
  easedNumberDisplayEl.innerHTML = Math.round(value);
});

// pick a random number every second and write it to screen
setInterval(() => {
  easedNumber.setTarget(Math.round(Math.random() * 2000));
}, 2000);

// break
insertHtmlStr('<hr/>');

/////////////////////////////////////////////
// Unit tests
/////////////////////////////////////////////
