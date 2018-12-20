/////////////////////////////////////////////
// DOM tests
/////////////////////////////////////////////

// header
mainEl.appendChild(DOMUtil.stringToDomElement("<h1>Lightbox &amp; LazyImageLoader</h1>"));

// add lazy-loaded image markup and init
// also give image a class for lightbox.js functionality
insertHtmlStr(`<code>new LazyImageLoader(el)</code> <div class="lazy-load-image-container"><img class="imagexpander" data-src="https://c.static-nike.com/a/images/w_960,c_limit/v8vaxhzy3f1pvvggaxnz/doernbecher-freestyle.jpg"></div>`);
let lazyImgContainer = document.querySelector('.lazy-load-image-container');
let lazyImageLoader = new LazyImageLoader(lazyImgContainer);
// lazyImageLoader.dispose();

// break
insertHtmlStr('<hr/>');

/////////////////////////////////////////////
// Unit tests
/////////////////////////////////////////////
