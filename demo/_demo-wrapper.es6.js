// demo must be in a <body> tag.
// this will grab the demo wrapper template,
// insert the demo's body tage,
// and replace the document html so we can "include" a layout once

function wrapPage(url) {
  let body = document.querySelector('body');
  fetch(url)
    .then((response) => {
      return response.text();
    }).then((html) => {
      let doc = new DOMParser().parseFromString(html, 'text/html');
      doc.documentElement.replaceChild(body, doc.body);
      document.documentElement.replaceWith(doc.documentElement);
    }).catch((error) => {
      console.warn('Something went wrong.', error);
    });
}
wrapPage('_demo-wrapper.html');
