// install:
// - npm install ws
// run:
// - node ws-chatroom.js
// from:
// - https://github.com/websockets/ws

"use strict";
process.title = 'node-ws';

/////////////////////
// Imports
/////////////////////

const WebSocket = require('ws');
const querystring = require('querystring');

/////////////////////
// Config
/////////////////////

var wssPort = 3001;
let rooms = {};
let DEFAULT_ROOM = 'default_room';

function bigLog(msg) {
  console.log('===================================');
  console.log('\x1b[42m%s\x1b[0m', msg);
  console.log('===================================');
}

/////////////////////
// BUILD SERVER
/////////////////////

// start server
const wsServer = new WebSocket.Server({ port: wssPort });
// console.log(wsServer);
bigLog('Running WebSocket server: ' + wsServer.url + ':' + wssPort);

// listen for new connections
wsServer.on('connection', function connection(connection, request, client) {
  // check for room id
  let queryObj = querystring.decode(request.url.replace('/?', ''));
  let roomId = (!!queryObj.roomId) ? queryObj.roomId : DEFAULT_ROOM;
  // connection.roomId = roomId; // attach roomId to connection. not being used right now

  // add connection to room. lazy-init array of clients per room
  if(!rooms[roomId]) rooms[roomId] = [];
  let roomClients = rooms[roomId];
  roomClients.push(connection);
  bigLog('Client joined room: ' + roomId + ' - Room has ' + roomClients.length + ' users.');

  // response to incoming messages
  connection.on('message', function incoming(message) {
    // parse json
    message = JSON.parse(message);
    console.log(`[${roomId}] received:`, JSON.stringify(message));

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
        bigLog('Client left room: ' + roomId + ' - Room has ' + roomClients.length + ' users.');
      }
    }
  });

});