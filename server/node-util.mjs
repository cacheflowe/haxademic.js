import fs from "fs";
import path from "path";

// script args ------------------------

export function getScriptArgs() {
  return process.argv.slice(2);
}

export function argExists(argKey) {
  return args.indexOf(argKey) != -1;
}

// files util -------------------------

export async function fileOrDirExists(path) {
  return await fs.existsSync(path);
}

export async function createDir(dirPath) {
  if (!(await fileOrDirExists(dirPath))) {
    await fs.mkdirSync(dirPath);
  }
}

export async function deleteDir(dirPath) {
  await fs.rmdirSync(dirPath, { recursive: true });
}

export async function filesInDir(dirPath) {
  return await fs.readdirSync(dirPath);
}

export async function fileSizeBytes(filePath) {
  let fileStats = await fs.promises.stat(filePath);
  return fileStats.size;
}

export async function fileSizeMb(filePath) {
  return (await fileSizeBytes(filePath)) / (1024 * 1000);
}

export async function imageFileToBase64(filePath) {
  let fileData = fs.readFileSync(filePath);
  return Buffer.from(fileData).toString("base64");
}

export async function writeStringToFile(filePath, contentStr) {
  return await fs.writeFileSync(filePath, contentStr);
}

export async function loadTextFileLines(filePath) {
  const fileContents = await fs.readFileSync(filePath, "utf-8");
  return fileContents.split(/\r?\n/);
}

export async function loadJsonFromFile(filePath) {
  return JSON.parse(await fs.readFileSync(filePath, "utf8"));
}

export async function writeJsonToFile(filePath, jsonObj) {
  return await fs.writeFileSync(filePath, JSON.stringify(jsonObj, null, 2));
}

export function listFilesInDir(dir) {
  fs.readdir(dir, function (err, files) {
    if (err) {
      return console.log("Unable to scan directory: " + err);
    } else {
      console.log("Listing files in", tmpDir, files.length);
      if (files && files.length) {
        files.forEach((file) => console.log("-", file));
      } else {
        console.log("No files found");
      }
    }
  });
}

// net -------------------------------

async function downloadImage(url, filepath) {
  // TODO: rewrite with fetch()
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

// logging ----------------------------

export function bigLog(msg) {
  console.log("===================================");
  console.log("\x1b[42m%s\x1b[0m", msg);
  console.log("===================================");
}

export default {
  getScriptArgs,
  argExists,
  fileOrDirExists,
  createDir,
  deleteDir,
  filesInDir,
  fileSizeBytes,
  fileSizeMb,
  loadTextFileLines,
  loadJsonFromFile,
  writeJsonToFile,
  listFilesInDir,
  downloadImage,
  bigLog,
};
