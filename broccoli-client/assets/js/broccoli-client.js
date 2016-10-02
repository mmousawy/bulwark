// Connect to server
const socket = io('http://127.0.0.1:3000/');

// Listen to the following...
socket.on('connect', function(){});
socket.on('render-click', function(data) {
  renderClick(data);
});
socket.on('event', function(data){});
socket.on('disconnect', function(){});
