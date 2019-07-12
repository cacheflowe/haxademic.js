/////////////////////////////////////////////
// DOM tests
/////////////////////////////////////////////

// header
mainEl.appendChild(DOMUtil.stringToDomElement("<h1>SVGUtil</h1>"));

// add original test svg to dom as inline svg
mainEl.appendChild(DOMUtil.stringToDomElement("<span class='svg-test-inline'></span>"));
let svgTestInline = document.querySelector('.svg-test-inline');
let svgEl = DOMUtil.stringToDomElement(SVGUtil.testSVG);
svgTestInline.appendChild(DOMUtil.stringToDomElement(`<div>Original inline svg</div>`));
svgTestInline.appendChild(svgEl);

// turn it into a png image
mainEl.appendChild(DOMUtil.stringToDomElement("<span class='svg-test-results-1'></span>"));
let svgTestResults1 = document.querySelector('.svg-test-results-1');
SVGUtil.rasterizeSVG(svgEl, (base64Img) => {
  svgTestResults1.appendChild(DOMUtil.stringToDomElement(`<div><code>SVGUtil.rasterizeSVG(svgEl, (base64Img) => { console.log(base64Img); })</code> (png)</div>`));
  let svgImg = document.createElement('img');
  svgImg.src = base64Img;
  svgTestResults1.appendChild(svgImg);
});

// turn it into a jpg image
mainEl.appendChild(DOMUtil.stringToDomElement("<span class='svg-test-results-2'></span>"));
let svgTestResults2 = document.querySelector('.svg-test-results-2');
SVGUtil.rasterizeSVG(svgEl, (base64Img) => {
  svgTestResults2.appendChild(DOMUtil.stringToDomElement(`<div><code>SVGUtil.rasterizeSVG(svgEl, (base64Img) => { console.log(base64Img); }, 0.8)</code> (jpg, 0.8 quality)</div>`));
  let svgImg = document.createElement('img');
  svgImg.src = base64Img;
  svgTestResults2.appendChild(svgImg);
}, 0.8);

insertHtmlStr('<hr/>');

/////////////////////////////////////////////
// Unit tests
/////////////////////////////////////////////

// zoraTests
//   .test('SVGUtil.rasterizeSVG', function*(assert) {
//     SVGUtil.rasterizeSVG(svgEl, (base64Img) => {
//       console.log(base64Img);
//       // assert.equals(base64Img, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAEuklEQVR4Xu2bjW0VMQyA3QmACYAJgAmgEwATABMAE0AnACYANqATABNQJgAmgE4A+p7OT+npLrYTX9s7Gql6iOYl8Rf/xUkPJKddF5GHInJLRB4Mn/y7bD9FhJ8vw+exiPzJmb59lIP2rwpCPxGRpyJyt3GcExH5ICIfLwpGCwB29vkgOBAyGpoAiHeDdmSM6RojCuCViLwQ2e3+Eg0Qb0XkaInBp8b0AkDF33eoelQeTOPxeWiDBwA2/mbBXZ+DgzY8E5FPUXqR/hYAhGfnL7IBAf+wSKsBuAzCq9CLQZgD0Co8sR2VJd6jwtgyDR+C4ySCPBpyhuiO4hPSzWEKAIv9HLD5XyLyelicN7EBBiDw+NecJBj7XrZjnALwLeDtCVcI4RV8LCsgCKuEV09Do4CQ1sYA2EnPYk6HlFdVvHdBaB0pskcbgM46U1oJAPtk960k5/sg/Nyu/zVWNud3mBcId4zvp5pCuRhUmRS31th5QNVUvhUA8wIBB2ppQpoWKAAm/mHsvlftewBoxEATa40NuN3he/ZjKwAcEdlerXmp9wJgDR5flJIbKADL8xPqcFQeb58BwGMKKREBAEz229j9CO0MACzHk4zdcG7KrHgAyJ4oC4BnY7qzQwBY3p/0lqzN27IAMB+pL6W2ueb1S1UNIPber0wyVn9LQC+ouX5laLac89chJ2mek8kIf+MCZjng4ZCg6P+dJwAKrJxL5ho5A+GwuQHAEojcu0x5rf7Nixm+WGoAkcfKCayaRnU9HgDjCc4TAIu35rsC0KNyHg24zCbAwaz1TmLHDQA4kpsVipfZCaZEgf8+DK45EeImiVyhuV2lwis/DHWFQHWCfJLo1EpRkQJERtz2FGi6HWAJwMq56es9eGQA8BREXg4HuWb7LwF4ChD0H+cEU5P3AvCkv57apAtMtCjqMYUeAB7Vj2ijCWFcFscXWBVZ+pAcLVEW5+RnZXZpu1+agJLy2B59ER4ImRcj3uu4FNtXgafCiBURSrUCGMmIp1g6pY6oPHcR3pueFM9fLmQKAMURjynoOAhPFIm8+tJXZWSh1k2UzpOq+jUN4HeeQunUjlLD0+txFlxej+NbsG+qPJEao87DmQVNQQvS2loeSJQCo3Fqet0grFSyVRO6F+YYAE2jYNvqf3ZTWADog7ryRscKj441h7qoCdUq1t2vyTwAWDWOEeLW1XVIwkpn7Bzw+lqlNm5XSPYCKPMEPP5S2sCuY99EhzLKWPMBgfwg/JosCkC1AQj4B2thXo1AcISeem7jOajpPPQlL3G3FgA6OPEbCPy0mgaqjmmxczVnZl2RlQIzFs7R1XoAlBMAg/iucR6fURZaqd6qgDguYnrkyZv3+YyuyTqv7NeeBcBFu7NTNEMFAppQPa+sCQD8Iq/J6G9GiLUBQKiW5Gz2gccaAQDBe2wvrY4IQ6g809YKACHw9vzJTqTxHSDsI86aASB4pHYxGSHWDiAaHhUC96G8LzpZO4CWyHBGE7YAAIGspzRzfuJoKwBaw+MmTGAc6qwH35sJg3NqHQmPp1syAQUSiQzHWwQACCCQI9Se/tDvcKsANDxiDnO1it35YMsAVBOoElFfVBBc4HAuoCYh/wBn5RaOTa9mvwAAAABJRU5ErkJggg==');
//     });
//     SVGUtil.rasterizeSVG(svgEl, (base64Img) => {
//       console.log(base64Img);
//       // assert.equals(base64Img, 'data:image/jpeg;base64,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');
//     }, 0.8);
//   })
