/////////////////////////////////////////////
// DOM tests
/////////////////////////////////////////////

// header
mainEl.appendChild(DOMUtil.stringToDomElement("<h1>EasyScroll</h1>"));

// create scroll object
let easyScrollWindow = new EasyScroll(window);

// add buttons to DOM to scroll window
insertHtmlStr(`<button id="easy-scroll-up-button">Scroll window to &lt;h1&gt;</code>`);
let scrollButtonUp = document.getElementById('easy-scroll-up-button');
scrollButtonUp.addEventListener('click', (e) => {
  easyScrollWindow.scrollToEl(1000, document.querySelector('h1'), 50);
});

insertHtmlStr(`<button id="easy-scroll-down-button">Scroll window by -100</code>`);
let scrollButtonDown = document.getElementById('easy-scroll-down-button');
scrollButtonDown.addEventListener('click', (e) => {
  easyScrollWindow.scrollByY(1000, -100);
});

// create scroll object for specific content element
insertHtmlStr(`<div id="easy-scroll-content-element" style="width:200px; height: 100px; overflow: auto;">Scroll<br>Scroll<br>Scroll<br>Scroll<br>Scroll<br>Scroll<br>Scroll<br>Scroll<br>Scroll<br>Scroll<br>Scroll<br>Scroll<br>Scroll<br><h4>Bottom</h4></div>`);
let easyScrollEl = new EasyScroll(document.getElementById('easy-scroll-content-element'));

// add button to DOM to scroll content element
insertHtmlStr(`<button id="easy-scroll-content-button-bottom">Scroll content el to &lt;h4&gt;</code>`);
let scrollButtonContentBottom = document.querySelector('#easy-scroll-content-button-bottom');
scrollButtonContentBottom.addEventListener('click', (e) => {
  easyScrollEl.scrollToEl(1000, document.querySelector('#easy-scroll-content-element h4'), 50);
});

insertHtmlStr(`<button id="easy-scroll-content-button">Scroll content el by 100</code>`);
let scrollButtonContent = document.querySelector('#easy-scroll-content-button');
scrollButtonContent.addEventListener('click', (e) => {
  easyScrollEl.scrollByY(1000, 100);
});


// break
insertHtmlStr('<hr/>');

/////////////////////////////////////////////
// Unit tests
/////////////////////////////////////////////
