//////////////////////////////////////
// Basic node api server
// - From: https://www.digitalocean.com/community/tutorials/how-to-create-a-web-server-in-node-js-with-the-http-module
// Use nodemon to automatically restart the server when changes are made
// Usage: `nodemon node src/nodejs/backend.js`
//////////////////////////////////////

import http from "http";
import { promises as fs } from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const host = "localhost";
const port = 8000;

// handle incoming requests -------------------

const requestListener = function (req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  // grab path and parse path components
  const { url } = req;
  const path = url.split("/").filter((p) => p && p.length > 0);
  console.log(path);
  // handle different paths
  if (url === "/") {
    handleHomeRoute(res);
  } else if (path[0] == "html") {
    handleHtml(res);
  } else if (path[0] == "current") {
    handleCurrentMessage(res);
  } else {
    handleNotFoundRoute(res);
  }
};

const handleHomeRoute = (res) => {
  res.setHeader("Content-Type", "text/html");
  res.writeHead(200);
  res.end("Hello! This is the home route.");
};

const handleHtml = (res) => {
  res.setHeader("Content-Type", "text/html");
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  fs.readFile(__dirname + "/index.html").then((contents) => {
    res.setHeader("Content-Type", "text/html");
    res.writeHead(200);
    res.end(contents);
  });
};

const handleCurrentMessage = async (res) => {
  try {
    const response = await fetch("https://some.api/endpoint", {
      body: JSON.stringify({ test: "data" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    if (!response.ok) {
      res.writeHead(500);
      res.end({ error: error.message });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.text();
    res.setHeader("Content-Type", "application/json");
    res.writeHead(200);
    res.end(data);
  } catch (error) {
    console.error("Fetch failed:", error);
    res.writeHead(500);
    res.end("Error fetching data from fake API");
  }
};

const handleNotFoundRoute = (res) => {
  res.setHeader("Content-Type", "text/html");
  res.writeHead(404);
  res.end("404 Not Found");
};

// start server --------------------------------

const server = http.createServer(requestListener);
server.listen(port, host, () => {
  console.log(`Server is on http://${host}:${port}`);
});
