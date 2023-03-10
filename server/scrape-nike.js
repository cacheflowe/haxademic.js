
// install:
// - npm install axios
// - ...or just npm install once package.json exists
// run:
// - node scrape.js

"use strict";
process.title = 'nike-scrape';

const fs = require('fs');
const axios = require('axios');


function getJsonURL(page) {
  // anchor goes by 50, up to 5250 as of 8/25/22
  return `https://api.nike.com/product_feed/threads/v2?filter=marketplace(US)&filter=language(en)&filter=channelId(010794e5-35fe-4e32-aaff-cd2c74f89d61)&anchor=${page}`;
}

// async function downloadImage(url, filepath) {
// const response = await axios({
async function downloadImage(url, filepath) {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });
    return new Promise((resolve, reject) => {
        response.data.pipe(fs.createWriteStream(filepath))
            .on('error', reject)
            .once('close', () => resolve(filepath)); 
    });
}

(async () => {
  let images = [];
  let pageStart = 51;
  let pageEnd = 51;
  for(var i = pageStart; i <= pageEnd; i++) {
    try {
      // get htmls & load into cheerio DOM
      let url = getJsonURL(i * 50);
      const response = await axios.get(url);
      console.log('====================\n', url, '\n====================');
      response.data.objects.forEach((el) => {
        console.log(!!el.publishedContent.nodes[0].nodes);
        if(el.publishedContent.nodes?.length > 0 && el.publishedContent.nodes[0].nodes?.length > 0) {
          images.push(el.publishedContent.nodes[0].nodes[0].properties.portraitURL);
        }
      });
      console.log(`Found ${images.length} images`);
    } catch (e) {
      console.error(`Error while fetching sneakers - ${e.message}`);
    }
  }

  // download
  images.forEach((el, i) => {
    let urlPathComponents = el.split('/');
    let filename = urlPathComponents[urlPathComponents.length - 1];
    console.log(`Downloading ${i} of ${images.length}`);
    // console.log(el, 'downloads/'+filename);
    downloadImage(el, 'downloads-nike/'+filename);
  });
})();

