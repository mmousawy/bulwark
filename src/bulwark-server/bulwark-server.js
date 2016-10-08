const bServer = {
  PLAYERS: []
};

console.log('>>> Starting server...');

const server = require('http').createServer();
const io = require('socket.io')(server);

console.log('[1/2] Server and socket.io module loaded');

io.on('connection', function(socket) {
  const current_player = addPlayer();

  //io.sockets.emit('player-join', current_player);
  socket.broadcast.emit('player-join', current_player);
  socket.emit('self-join', current_player);

  console.log(`User joined with id ${current_player.id}`);

  socket.on('event', function(data){});

  // Listen to click event
  socket.on('player-click', function(data) {
    // Log a message with the position
    console.log(`A user clicked on the location x: ${data.x}, y: ${data.y}`);
    io.sockets.emit('player-click', data);
  });

  // Listen to player update event
  socket.on('player-update', function(data) {
    // Log a message with the position
    socket.broadcast.emit('player-update', data);
  });

  socket.on('disconnect', function() {
    console.log('User disconnected!');
  });
});

console.log('[2/2] Server ready and listening for connections');

server.listen(3000);

//

function addPlayer() {
  const player = {
    id: genID()
  }

  bServer.PLAYERS.push(player);

  return player;
}

function genID() {
  return ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).slice(-4)
}
