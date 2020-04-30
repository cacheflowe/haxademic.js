// install:
// - npm install ws
// - npm install querystring
// - npm install express
// run:
// - node ws-chatroom.js [--debug]
// from:
// - https://github.com/websockets/ws

"use strict";
process.title = 'node-ws';

/////////////////////
// Imports
/////////////////////

const WebSocket = require('ws');
const querystring = require('querystring');
const express = require('express');

/////////////////////
// Config
/////////////////////

const args = process.argv.slice(2);
const wssPort = 3001;
const httpPort = process.env.httpPort || 3000;
const rooms = {};
const DEFAULT_ROOM = 'DEFAULT';
const debug = args.indexOf('--debug') != -1;

function bigLog(msg) {
  console.log('===================================');
  console.log('\x1b[42m%s\x1b[0m', msg);
  console.log('===================================');
}

/////////////////////
// BUILD HTTP server
/////////////////////

const INDEX = '/index.html';
const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(httpPort, () => console.log(`Listening on ${httpPort}`));


/////////////////////
// BUILD WS SERVER
/////////////////////

// start server
const wsServer = new WebSocket.Server({server: server, port: wssPort});   // For Heroku launch, remove `port`! Example server config here: https://github.com/heroku-examples/node-websockets
bigLog('Running WebSocket server at port:' + wssPort);

// listen for new connections
wsServer.on('connection', function connection(connection, request, client) {
  // check for room id
  let queryObj = querystring.decode(request.url.replace('/?', ''));
  let room = (!!queryObj.room) ? queryObj.room : DEFAULT_ROOM;

  // add connection to room. lazy-init array of clients per room
  if(!rooms[room]) rooms[room] = [];
  let roomClients = rooms[room];
  roomClients.push(connection);
  bigLog('Client joined room: ' + room + ' - Room has ' + roomClients.length + ' users');

  // response to incoming messages
  connection.on('message', function incoming(message) {
    // parse json
    message = JSON.parse(message);
    if(debug) {
      console.log(`[${room}] received:`, JSON.stringify(message));
    }

    // relay it back out to room, ignore self if: `client !== connection
    roomClients.forEach(function each(client) {   // relay to all clients: `wsServer.clients.forEach()`
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  });

  connection.on('close', function() {
    for (let i = 0; i < roomClients.length; i++) {
      const conn = roomClients[i];
      if(conn == connection) {
        roomClients.splice(i, 1);
        bigLog('Client left room: ' + room + ' - Room has ' + roomClients.length + ' users');
      }
    }
  });

});