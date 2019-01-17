class BulwarkInput {

  constructor(canvas_holder) {
    this.settings = {};

    this.INPUT = {
      mouse: {
        x: 0,
        y: 0
      }
    };

    return {
      settings: this.settings,
      INPUT: this.INPUT,
      init: this.init.bind(this),
      inputLoop: this.inputLoop.bind(this),
      mouseAngleFromPoint: this.mouseAngleFromPoint.bind(this)
    }
  }

  init(canvas_holder, bClient) {
    this.settings.holder = canvas_holder;
    this.settings.bClient = bClient;
    this.settings.holder.addEventListener('click', this.clickHandler.bind(this));
    this.settings.holder.addEventListener('mousemove', this.moveHandler.bind(this));
  }

  updateMouse(mouseEvent) {
    this.INPUT.mouse.x = Math.round( ( mouseEvent.clientX - this.settings.holder.offsetLeft ) * .5 );
    this.INPUT.mouse.y = Math.round( ( mouseEvent.clientY - this.settings.holder.offsetTop ) * .5 );
  }

  mouseAngleFromPoint(pointData = {dx: 0, dy: 0}, degrees) {
    // Delta mouse from point
    const dm_point = {
      dx: this.INPUT.mouse.x - pointData.x,
      dy: this.INPUT.mouse.y - pointData.y
    }

    const mouse_angle = Math.atan2(dm_point.dy, dm_point.dx);

    if (degrees) {
      return mouse_angle * ( 180 / Math.PI );
    }

    return mouse_angle;
  }

  moveHandler(mouseEvent) {
    this.updateMouse(mouseEvent);
  }

  clickHandler(mouseEvent) {
    this.updateMouse(mouseEvent);

    const bClient = this.settings.bClient;

    // Emmit cursor position on click
    bClient.settings.socket.emit('client-click', {
      x: this.INPUT.mouse.x,
      y: this.INPUT.mouse.y }
    );
  }

  inputLoop() {
    // Nothing here yet
  }
}
