/////////////////////////////////////////////
// DOM tests
/////////////////////////////////////////////

// header
mainEl.appendChild(DOMUtil.stringToDomElement("<h1>PageVisibility</h1>"));

// create log output element
insertHtmlStr(`<div id="page-vis-log-element" style="width:200px; height: 100px; overflow: auto;" style="background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPgogICAgPHN0eWxlIHR5cGU9InRleHQvY3NzIj4KICAgICAgICBsaW5lIHsgc3Ryb2tlOiAjY2NjOyB9CiAgICA8L3N0eWxlPgogICAgPGRlZnM+CiAgICAgICAgPHBhdHRlcm4gaWQ9ImdyaWQiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgcGF0dGVyblRyYW5zZm9ybT0icm90YXRlKDQ1KSI+CiAgICAgICAgICAgIDxsaW5lIHgxPSI1IiB5MT0iMCIgeDI9IjUiIHkyPSIxMCIgLz4KICAgICAgICAgICAgPGxpbmUgeDE9IjAiIHkxPSI1IiB4Mj0iMTAiIHkyPSI1IiAvPgogICAgICAgIDwvcGF0dGVybj4KICAgIDwvZGVmcz4KICAgIDxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiIC8+Cjwvc3ZnPgo=');"></div>`);
let pageVisLogEl = document.getElementById('page-vis-log-element');

// create page vis object
let pageVisibleCallback = () => {
  pageVisLogEl.innerHTML += 'visible<br>';
}
let pageHiddenCallback = () => {
  pageVisLogEl.innerHTML += 'hidden<br>';
}
let pageVisibility = new PageVisibility(pageVisibleCallback, pageHiddenCallback);

// break
insertHtmlStr('<hr/>');

/////////////////////////////////////////////
// Unit tests
/////////////////////////////////////////////
