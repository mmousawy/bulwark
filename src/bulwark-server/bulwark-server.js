const bServer = {
  clients: {}
};

console.log('>>> Starting server...');

const server = require('http').createServer();
const io = require('socket.io')(server);

console.log('[1/2] Server and socket.io module loaded');

io.sockets.on('connection', function(socket) {
  const current_client = newClient();
  console.log(`Client connected with id ${current_client.id}`);

  socket.emit('clients-list', bServer.clients);

  socket.on('clients-list', function() {
    console.log('Requesting clients list');
    socket.emit('clients-list', bServer.clients);
  });

  socket.on('chat-message', function(data) {
    console.log("Chat message received", data);
    io.sockets.emit('new-chat-message', data);
  });

  // Listen to signin event
  socket.on('client-signin', function(data) {
    console.log(data);
    console.log(`A client with id ${current_client.id} signed in with nickname: ${data.nickname}`);
    addClient(current_client, data);
    socket.broadcast.emit('client-signin', data);
    socket.join('main-lobby');
    current_client.location = 'main-lobby';
    socket.emit('self-signin', current_client);

    // Emit new clients list to all clients
    io.sockets.emit('clients-list', bServer.clients);
  });

  socket.on('client-click', function(data) {
    // Log a message with the position
    console.log(`A user clicked on the location x: ${data.x}, y: ${data.y}`);
    io.sockets.emit('client-click', data);
  });

  // Listen to client update event
  socket.on('client-update', function(data) {
    // Log a message with the position
    socket.broadcast.emit('client-update', data);
  });

  socket.on('disconnect', function(data) {
    // Emit new clients list to all clients
    removeClient(current_client);
    console.log(`${current_client.id} disconnected!`);
    if (current_client.nickname) {
      socket.broadcast.emit('client-signoff', current_client);
    }
    socket.broadcast.emit('clients-list', bServer.clients);
  });
});

console.log('[2/2] Server ready and listening for connections');

server.listen(3000);

//

function newClient() {
  const client = {
    id: genID()
  }

  console.log(`Client connected with id ${client.id}`);

  return client;
}

function addClient(client, data) {
  client.nickname = data.nickname;

  bServer.clients[client.id] = client;

  console.log(`Client signed in with nickname ${data.nickname}`);
  console.log("Current clients list (" + (Object.keys(bServer.clients).length) + "): ");
  console.log(bServer.clients);

  return true;
}

function removeClient(current_client) {
  if (bServer.clients[current_client.id] == current_client) {
    delete bServer.clients[current_client.id];
  }
  console.log("Current clients list (" + (Object.keys(bServer.clients).length) + "): ");
  console.log(bServer.clients);
}

function genID() {
  return ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).slice(-4)
}
