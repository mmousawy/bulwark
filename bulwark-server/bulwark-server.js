console.log('>>> Starting server...');

const server = require('http').createServer();
const io = require('socket.io')(server);

console.log('[1/2] Server and socket.io module loaded');

io.on('connection', function(socket) {
  console.log('User connected!');

  socket.on('event', function(data){});

  // Listen to click event
  socket.on('click', function(data) {
    // Log a message with the position
    console.log(`A user clicked on the location x: ${data.x}, y: ${data.y}`);
    io.sockets.emit('render-click', data);  
  });

  socket.on('disconnect', function() {
    console.log('User disconnected!');
  });
});

console.log('[2/2] Server ready and listening for connections');

server.listen(3000);
