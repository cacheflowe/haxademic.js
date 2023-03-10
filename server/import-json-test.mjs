// install:
// - npm install screenshot-desktop
// - npm install axios
// - ...or just npm install once package.json exists
// run:
// - node screenshot-test.js [--debug]

"use strict";
process.title = 'node-screenshot';

/////////////////////
// Imports
/////////////////////

const fs = import('fs');
const screenshot = import('screenshot-desktop');
const axios = import('axios');
// const data = import('../data/sample-data.mjs');
// const data = import('../data/sample-data.json');
// import data from '../data/sample-data.json';

// `import` json without special flags
import { readFile } from 'fs/promises';
const data = JSON.parse(await readFile(new URL('../data/sample-data.json', import.meta.url)));


console.log(data);
