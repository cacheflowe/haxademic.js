// insert test results here
let mainEl = document.getElementById('main');

// insert code
function insertHtmlStr(str) {
  const el = document.createElement('div');
  el.innerHTML = str;
  mainEl.appendChild(el);
}
