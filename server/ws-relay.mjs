// install:
// - npm install ws
// - npm install express
// run:
// - node ws-relay.mjs [--debug]

"use strict";
process.title = "node-ws";

/////////////////////
// Imports
/////////////////////

import express from "express";
import WebSocket, { WebSocketServer } from "ws";

import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// const wss = new WebSocketServer({ port: 8080 });

/////////////////////
// Config
/////////////////////

const args = process.argv.slice(2);
const wssPort = 3001;
const httpPort = process.env.httpPort || 3000;
const debug = args.indexOf("--debug") != -1;

function eventLog(...args) {
  console.log("===================================");
  for (let arg of args) {
    console.log("\x1b[42m%s\x1b[0m", arg);
  }
  console.log("===================================");
}

/////////////////////
// BUILD HTTP server
/////////////////////

const server = express()
  .use((req, res) => res.sendFile("./index.html", { root: __dirname }))
  .listen(httpPort, () =>
    eventLog(`Running Express web server at port: ${httpPort}`)
  );

/////////////////////
// BUILD WS SERVER
/////////////////////

// start server
const wsServer = new WebSocketServer({
  port: wssPort,
  host: "0.0.0.0", // allows connections from localhost and IP addresses
  path: "/ws",
}); // For Heroku launch, remove `port`! Example server config here: https://github.com/heroku-examples/node-websockets
eventLog(
  `Running WebSocket server at port: ${wssPort}`,
  `Be sure to connect at ws://localhost:3001/ws`
);

// listen for new connections
wsServer.on("connection", (connection, request, client) => {
  eventLog("Client joined - We have " + wsServer.clients.size + " users");

  // handle incoming messages
  connection.on("message", (message, isBinary) => {
    if (debug) console.log(`[JSON IN]: ${message}`);

    // relay incoming message to all clients
    wsServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message, { binary: isBinary });
      }
    });
  });

  // handle client disconnect
  connection.on("close", () => {
    eventLog("Client left - We have " + wsServer.clients.size + " users");
  });
});
