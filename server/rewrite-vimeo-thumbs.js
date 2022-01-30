// install:
// - npm install axios
// run:
// - node rewrite-links-in-file.js

"use strict";
process.title = 'vimeo-thumbs-rewrite';

/////////////////////
// Imports
/////////////////////

const events = require('events');
const fs = require('fs');
const readline = require('readline');
const axios = require('axios');

/////////////////////
// Process file
/////////////////////

// synchronous Vimeo api requests
async function getNewThumb(vimeoDataURL) {
  return axios
    .get(vimeoDataURL, {})
    .then(res => {
      // console.log(`statusCode: ${res.status}`)
      return res.data[0].thumbnail_large;
    })
    .catch(error => {
      // console.error(error)
      return null;
    })
}

(async function processLineByLine() {
  try {
    const rl = readline.createInterface({
      input: fs.createReadStream('inspiration.php'),
      crlfDelay: Infinity
    });
    
    /////////////////////////////////////////////
    // build regex to find Vimeo links & thumbs
    /////////////////////////////////////////////
    // GET VIMEO VIDEO URL
    // line.match(/https:\/\/vimeo\.com\/([0-9]+)/gi)
    // GET THUMBNAIL
    // line.match(/https:\/\/i.vimeocdn.com\/video\/([0-9_]+).jpg/gi)
    // GET VIDEO ID
    // line.match(/vimeo\.com\/([0-9]+)"/) // all results
    /////////////////////////////////////////////
    const videoURLRegex = /https:\/\/vimeo\.com\/([0-9]+)/gi;
    const videoIdRegex = /vimeo\.com\/([0-9]+)"/;
    const thumbnailURLRegex = /https:\/\/i.vimeocdn.com\/video\/([0-9_]+).jpg/gi;

    // concatenated string
    let finalHTML = '';

    for await (const line of rl) {
      // console.log(line);
      // regex current line
      let videoURLMatch = line.match(videoURLRegex);
      let videoThumbnailMatch = line.match(thumbnailURLRegex);
      let videoIdMatch = line.match(videoIdRegex);

      // if we found a vimeo video link
      if(!!videoURLMatch) {
        let videoURL = videoURLMatch[0];
        let oldThumbnailURL = (videoThumbnailMatch) ? videoThumbnailMatch[0] : null;
        if(oldThumbnailURL) {
          let videoId = videoIdMatch[1];
          let apiDataURL = `https://vimeo.com/api/v2/video/${videoId}.json`;
          console.log('Loading Vimeo data from:', apiDataURL);
          let newThumbnail = await getNewThumb(apiDataURL).then((newThumbnailURL) => {
            if(!!newThumbnailURL) {
              // console.log(`${videoURL} -> ${newThumbnailURL}`);
              finalHTML += line.replace(oldThumbnailURL, newThumbnailURL) + '\n';
            } else {
              // video is probably missing - no json returned
              console.log('Video missing? ', videoURL);
              finalHTML += line + '\n';
            }
          });
        } else {
          console.log('Vimeo line has no thumb? ', videoURL);
          finalHTML += line + '\n';
        }
      } else {
        finalHTML += line + '\n';
      }
    }
      
    /////////////////////////////////////////////
    // Write to file
    /////////////////////////////////////////////
    fs.writeFile("./inspiration-edited.php", finalHTML, function(err) {
      if(err) return console.log(err);
      console.log("The file was saved!");
    });

    /////////////////////////////////////////////
    // DONE
    /////////////////////////////////////////////
    await events.once(rl, 'close');

    console.log('Reading file line by line with readline done.');
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
  } catch (err) {
    console.error(err);
  }
})();