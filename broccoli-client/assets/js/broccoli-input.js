window.addEventListener('click', function(event) {
  // Emmit cursor position on click
  socket.emit('click', { x: event.clientX, y: event.clientY } );
})
