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

// const wss = new WebSocketServer({ port: 8080 });

/////////////////////
// Config
/////////////////////

const args = process.argv.slice(2);
const wssPort = 3001;
const httpPort = process.env.httpPort || 3000;
const debug = args.indexOf("--debug") != -1;

function eventLog(msg) {
  console.log("===================================");
  console.log("\x1b[42m%s\x1b[0m", msg);
  console.log("===================================");
}

/////////////////////
// BUILD HTTP server
/////////////////////

const INDEX = "/index.html";
const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(httpPort, () => eventLog(`Running Web server at port: ${httpPort}`));

/////////////////////
// BUILD WS SERVER
/////////////////////

// start server
const wsServer = new WebSocketServer({ port: wssPort, path: "/ws" }); // For Heroku launch, remove `port`! Example server config here: https://github.com/heroku-examples/node-websockets
eventLog(`Running WebSocket server at port: ${wssPort}`);

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
