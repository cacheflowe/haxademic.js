// invert css
var cssString = `
  html {
    background-color: #fff;
    color: #444;
    filter: invert(1) hue-rotate(180deg);
  }
  img, video {
    filter: invert(1) hue-rotate(180deg)
  }
`;

// inject css
var styleEl = document.createElement("style");
styleEl.textContent = cssString;
document.head.append(styleEl);
