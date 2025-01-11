// `import` json on server side without special flags

import { readFile } from "fs/promises";
const data = JSON.parse(
  await readFile(new URL("../data/sample-data.json", import.meta.url))
);

console.log(data);

// import json on client side

/*

// https://2ality.com/2025/01/import-attributes.html

import data from '../data/sample-data.json' assert { type: "json" };
import data from '../data/sample-data.json' with { type: 'json' };

*/
