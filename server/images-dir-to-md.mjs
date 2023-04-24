// run:
// - node images-dir-to-md.mjs [--debug]

"use strict";

import fs from "fs";
import path from "path";
import sharp from "sharp"; // https://sharp.pixelplumbing.com/api-constructor
import {
  createDir,
  fileSizeMb,
  bigLog,
  fileOrDirExists,
  writeStringToFile,
} from "./node-util.mjs";

// image/path config
// set path to images directory
// let imgsSrcDir = "images";
// let imgsSrcDir = `D:\\workspace\\haxademic\\www\\demo-images\\images`;
let imgsSrcDir = `../../haxademic/output/_demo-images/`;

// output path config
let outputPath = `../../haxademic/guides/haxademic-demos/`;
let outputPathImages = `${outputPath}images/`;
let outputPathMd = `${outputPath}README.md`;

// create output dir if it doesn't exist
createDir(outputPath);
createDir(outputPathImages);

// start markdown string
let mdString = `
# Haxademic Demo Images
These images are auto-exported from the Haxademic demos. They serve as a reminder of what the demos look like, and may be used in the Haxademic documentation.

## Images
`;

// Function to get current filenames in directory
bigLog(`Parsing files in: ${imgsSrcDir}`);
let filenames = fs.readdirSync(imgsSrcDir);
let numFiles = filenames.length;
let lastPackageLabel = null;

// helper for creating markdown headers per package
function packageLabelFromPath(file) {
  let packagePath = file.replace("com.haxademic.demo.", "");
  packagePath = packagePath.split(".Demo")[0];
  packagePath = packagePath.split(".");
  packagePath = packagePath.map((element) => {
    return element.charAt(0).toUpperCase() + element.substring(1);
  });
  packagePath = packagePath.join(" > ");
  return packagePath;
}

async function processImage(file) {
  // source
  let imgPath = await path.join(imgsSrcDir, file);
  let fileSize = await fileSizeMb(imgPath); // fileSizeBytes, fileSizeMb

  // destination
  let fileDest = file.replace(".png", ".webp");
  let outputPathForFile = `${outputPathImages}${fileDest}`;

  // log image info
  // console.log("File name:", file);
  // console.log("fileDest:", fileDest);
  // console.log("Full path:", imgPath);
  // console.log("Size:", `${fileSize.toFixed(2)} MB`);

  // load image & get metadata
  const image = await sharp(imgPath);
  const metadata = await image.metadata();
  let srcImgInfo = {
    width: metadata.width,
    height: metadata.height,
    ratio: metadata.width / metadata.height,
    format: metadata.format,
    size: fileSize,
  };

  // resize image
  if (!fileOrDirExists(outputPathForFile)) {
    let outputW = metadata.width < 1024 ? metadata.width : 1024;
    await image
      // .clone() - could be used to process large amounts of images in parallel with an array of promises. look at DNA
      .resize({
        width: outputW,
        height: null,
      })
      .webp({ quality: 85 })
      .toFile(outputPathForFile);
  }

  // create markdown headers per package
  let curPackageLabel = packageLabelFromPath(file);
  if (curPackageLabel != lastPackageLabel) {
    mdString += `\n---\n`;
    mdString += `\n### ${curPackageLabel}\n\n`;
    lastPackageLabel = curPackageLabel;
  }

  // gh links for markdown
  let outputPathForMd = `images/${fileDest}`;
  let javaFile = file.replace(".png", ".java");
  let bareJavaFile = "Demo_" + javaFile.split(".Demo_")[1];
  let linkFile = file.replace(".png", "");
  let classPathToFilePath = linkFile.replaceAll(".", "/");
  let ghLink = `https://github.com/cacheflowe/haxademic/blob/master/src/${classPathToFilePath}.java`;

  // update markdown string
  mdString += `[${bareJavaFile}](${ghLink})<br>\n`;
  mdString += `<img src="${outputPathForMd}" width="320"><br>\n`;
  // mdString += `![](${outputPathForMd})\n`;
}

// Loop through all the filenames
// Use for() loop, as forEach() doesn't respect await
for (let file of filenames) {
  await processImage(file);
}

// after wrapping up all the image processing, write the markdown file
writeStringToFile(outputPathMd, mdString);
bigLog(`Writing markdown file: ${outputPathMd}`);
bigLog(`Processed ${numFiles} images`);
