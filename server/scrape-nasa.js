// install:
// - npm install axios
// - npm install cheerio
// - ...or just npm install once package.json exists
// run:
// - node scrape.js
// from:
// - https://geshan.com.np/blog/2021/09/web-scraping-nodejs/
// Could also use:
// - https://github.com/apify/crawlee
// - https://github.com/website-scraper/node-website-scraper

"use strict";
process.title = "hubble-scrape";

const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");

// async function downloadImage(url, filepath) {
// const response = await axios({
async function downloadImage(url, filepath) {
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });
  return new Promise((resolve, reject) => {
    response.data
      .pipe(fs.createWriteStream(filepath))
      .on("error", reject)
      .once("close", () => resolve(filepath));
  });
}

(async () => {
  let images = [];
  let pageStart = 1;
  let pageEnd = 33;
  for (var i = pageStart; i <= pageEnd; i++) {
    try {
      // get htmls & load into cheerio DOM
      let url = `https://esahubble.org/images/archive/category/galaxies/page/${i}/`;
      console.log(`Loading ${i} of ${pageEnd}`);
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      // get inline javascript
      const scriptTags = $("script");
      const inlineJs = scriptTags.text();

      // find array of images
      let matches = inlineJs.match(/(https?:\/\/.*\.(?:jpg))/gi);
      matches.forEach((el) => {
        // images.push(el.replace('thumb300y', 'large'));
        images.push(el.replace("thumb300y", "wallpaper5"));
      });
      console.log(`Found ${matches.length} images! Total of ${images.length}`);
    } catch (e) {
      console.error(`Error while fetching galaxies - ${e.message}`);
    }
  }
  // console.log(images);

  // download
  images.forEach((el, i) => {
    let urlPathComponents = el.split("/");
    let filename = urlPathComponents[urlPathComponents.length - 1];
    console.log(`Downloading ${i} of ${images.length}`);
    // console.log(el, 'downloads/'+filename);
    downloadImage(el, "downloads/" + filename);
  });
})();

// original single page
/*
(async () => {
  const args = process.argv.slice(2);
  const pageNum = args[0] || 1;
  const url = `https://esahubble.org/images/archive/category/galaxies/page/${pageNum}/`;
  try {
    // get htmls & load into cheerio DOM
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    // do something
    const scriptTags = $('script');
    const inlineJs = scriptTags.text();
    // console.log(inlineJs);

    let matches = inlineJs.match(/(https?:\/\/.*\.(?:jpg))/gi);
    console.log(matches);

  } catch (e) {
    console.error(`Error while fetching galaxies - ${e.message}`);
  }
})();
*/
