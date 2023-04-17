// `import` json on server side without special flags

import { readFile } from "fs/promises";
const data = JSON.parse(
  await readFile(new URL("../data/sample-data.json", import.meta.url))
);

console.log(data);

// import json on client side

/*

import data from '../data/sample-data.json' assert { type: "json" };

*/
