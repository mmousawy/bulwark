const bServer = {
  clients: {},
  rooms: {}
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
    console.log(`Requesting clients list (${current_client.location})`);

    let clients_list = [];

    if (current_client.id && current_client.location !== "main-lobby") {
      clients_list = getClientsList(current_client.location);
    } else {
      clients_list = bServer.clients;
    }

    socket.emit('clients-list', clients_list);
  });

  socket.on('chat-message', function(data) {
    if (current_client.previous_message !== data.message) {
      console.log("Chat message received", data, "--> " + current_client.location);
      io.sockets.in(current_client.location).emit('new-chat-message', data);
      current_client.previous_message = data.message;
    }
  });

  // Listen to self-spawn event
  socket.on('spawn', function(data) {
    const clients_list = getClientsList(current_client.location);

    console.log('>>>', data);
    console.log('<<<', clients_list);

    console.log('###', current_client);

    const canvasWidth = 480;
    const clientDistance = canvasWidth / (bServer.rooms[current_client.location].clients + 1);

    debugger;
    clients_list.forEach((client, index) => {
      console.log(data.client_id, client.id);
      if (data.client_id === client.id) {
        console.log('>>>', index);
        data.position.x = clientDistance * (index + 1) - 32;
      }
    });

    socket.emit('self-spawn', data);
    socket.broadcast.to(current_client.location).emit('client-spawn', data);
  });

  // Listen to client-despawn event
  socket.on('client-despawn', function(data) {
    socket.emit('self-despawn', data);
    socket.broadcast.to(current_client.location).emit('client-despawn', data);
  });

  // Listen to signin event
  socket.on('client-signin', function(data) {
    if (data.nickname.length > 2 && !checkKeyValueExists(data.nickname, "nickname", bServer.clients)) {
      console.log(`A client with id ${current_client.id} signed in with nickname: ${data.nickname}`);
      addClient(current_client, data);
      socket.leave(current_client.location);

      current_client.location = 'main-lobby';
      socket.broadcast.to(current_client.location).emit('client-signin', data);
      socket.join('main-lobby');
      socket.emit('self-signin', current_client);
      socket.emit('rooms-list', bServer.rooms);

      socket.broadcast.to('main-lobby').emit('clients-list', bServer.clients);
    }
  });

  socket.on('client-click', function(data) {
    // console.log(`A client clicked on the location x: ${data.x}, y: ${data.y}`);
    io.sockets.to(current_client.location).emit('client-click', data);
    // io.sockets.emit('client-click', data);
  });

  // Listen to client update event
  socket.on('client-update', function(data) {
    socket.broadcast.to(current_client.location).emit('client-update', data);
  });

  socket.on('disconnect', function(data) {
    // Emit new clients list to all clients
    console.log(`${current_client.id} disconnected!`);

    if (current_client.nickname) {
      removeClient(current_client);
      if (current_client.location !== "main-lobby") {
        socket.broadcast.to(current_client.location).emit('client-leave', current_client);
      }

      socket.broadcast.to('main-lobby').broadcast.emit('client-signoff', current_client);
      io.sockets.emit('clients-list', bServer.clients);
    }
  });

  // Rooms
  socket.on('create-room', function(data) {
    if (data.room_name.length > 0
        && data.room_name !== 'main-lobby'
        && !checkKeyValueExists(data.room_name, "room_name", bServer.rooms)) {

      data.room_owner = current_client;

      let new_room = addRoom(data);
      new_room.clients = 1;

      socket.leave('main-lobby');
      socket.join(new_room.id);

      socket.broadcast.to(current_client.location).emit('create-room-done', data);
      socket.emit('create-room-self', data);
      socket.broadcast.to(current_client.location).emit('rooms-list', bServer.rooms);

      current_client.location = new_room.id;

      console.log(bServer.rooms);
    }
  });

  socket.on('join-room', function(data) {
    if ((data.id && data.id !== current_client.location) || (data.room_name == 'debug')) {

      if (data.room_name) {
        data.id = bServer.rooms[Object.keys(bServer.rooms)[0]].id;
      }

      console.log(`${current_client.id} joined the room ${data.id}`);

      socket.leave(current_client.location);
      socket.join(data.id);
      current_client.location = data.id;

      socket.emit('join-room-done', bServer.rooms[data.id]);
      bServer.rooms[data.id].clients += 1;

      socket.broadcast.to(current_client.location).emit('client-join', current_client);

      socket.broadcast.to(current_client.location).emit('clients-list', getClientsList(current_client.location));

      io.sockets.in('main-lobby').emit('clients-list', bServer.clients);
      io.sockets.in('main-lobby').emit('rooms-list', bServer.rooms);
    }
  });

  socket.on('leave-room', function(data) {
    if (current_client.location !== 'main-lobby') {
      let previous_room_id = current_client.location;
      let previous_room = bServer.rooms[previous_room_id];

      bServer.clients[current_client.id].location = 'main-lobby';

      previous_room.clients -= 1;

      if (previous_room.clients < 1) {
        delete bServer.rooms[previous_room_id];
        socket.broadcast.to('main-lobby').emit('rooms-list', bServer.rooms);
      } else {
        socket.broadcast.to(previous_room_id).emit('client-leave', current_client);
        socket.broadcast.to(previous_room_id).emit('clients-list', getClientsList(previous_room_id));
      }

      socket.leave(previous_room_id);
      socket.join('main-lobby');
      current_client.location = 'main-lobby';

      socket.emit('leave-room-done');
      socket.broadcast.to('main-lobby').emit('clients-list', bServer.clients);
    }
  });

  socket.on('rooms-list', function(data) {
    console.log('Requesting rooms list');
    io.sockets.in('main-lobby').emit('rooms-list', bServer.rooms);
  });

  socket.on('room-clients-list', function(data) {
    const clients_list = bServer.clients.find(function (client) {
      return client.location == current_client.location;
    });

    socket.emit('clients-list', clients_list);
  });

  // Game
  socket.on('start-game', function() {
    let room = null;
    if (bServer.rooms[current_client.location]) {
      room = bServer.rooms[current_client.location];

      room.status = "running";
      io.sockets.in(current_client.location).emit('start-game');
    }
  });

});

console.log('[2/2] Server ready and listening for connections');

server.listen(3000);

//

function checkKeyValueExists(needle, key, haystack) {
  console.log(needle, key, haystack);
  for (el_index in haystack) {
    let el = haystack[el_index];

    if (el[key] && el[key] == needle) {
      return true;
    }
  }

  return false;
}

function getClientsList(location) {
  let clients_list = [];

  for (client_index in bServer.clients) {
    let client = bServer.clients[client_index];

    if (client.location == location) {
      clients_list.push(client);
    }
  }

  return clients_list;
}

function newClient() {
  const client = {
    id: genID(),
    location: "main-lobby"
  }

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

function addRoom(data) {
  let room_id = genID();

  data.id = room_id;
  data.status = "pre-game";

  bServer.rooms[room_id] = data;
  console.log(`A client hosted a room with name: ${data.room_name}`);
  return data;
}

function removeClient(current_client) {
  if (bServer.clients[current_client.id] == current_client) {

    if (current_client.location !== 'main-lobby' && bServer.rooms[current_client.location]) {
      let current_room = bServer.rooms[current_client.location];
      current_room.clients -= 1;

      if (current_room.clients < 1) {
        delete bServer.rooms[current_client.location];
      }
    }

    delete bServer.clients[current_client.id];
  }
  console.log("Current clients list (" + (Object.keys(bServer.clients).length) + "): ");
  console.log(bServer.clients);
}

function genID() {
  return ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).slice(-4)
}
