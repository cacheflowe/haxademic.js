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

export function fileOrDirExists(path) {
  return fs.existsSync(path);
}

export async function createDir(dirPath) {
  if (!fileOrDirExists(dirPath)) {
    fs.mkdirSync(dirPath);
  }
}

export function deleteDir(dirPath) {
  fs.rmdirSync(dirPath, { recursive: true });
}

export function filesInDir(dirPath) {
  return fs.readdirSync(dirPath);
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
  bigLog,
};
