renderer.view.addEventListener('click', function(event) {
  let mouse = {x: 0, y: 0};

  mouse.x = event.clientX - this.offsetLeft;
  mouse.y = event.clientY - this.offsetTop;

  // Emmit cursor position on click
  socket.emit('click', { x: mouse.x, y: mouse.y } );
})
