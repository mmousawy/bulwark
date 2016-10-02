export default class BulwarkInput {

  constructor(canvas_holder) {
    this.SETTINGS = {};

    this.INPUT = {
      mouse: {
        x: 0,
        y: 0
      }
    };

    return {
      SETTINGS: this.SETTINGS,
      INPUT: this.INPUT,
      init: this.init.bind(this),
      mouseAngleFromPoint: this.mouseAngleFromPoint.bind(this)
    }
  }

  init(canvas_holder, client) {
    this.SETTINGS.holder = canvas_holder;
    this.SETTINGS.client = client;
    this.SETTINGS.holder.addEventListener('click', this.clickHandler.bind(this));
    this.SETTINGS.holder.addEventListener('mousemove', this.moveHandler.bind(this));
  }

  updateMouse(mouseEvent) {
    this.INPUT.mouse.x = Math.round( ( mouseEvent.clientX - this.SETTINGS.holder.offsetLeft ) * .5 );
    this.INPUT.mouse.y = Math.round( ( mouseEvent.clientY - this.SETTINGS.holder.offsetTop ) * .5 );
  }

  mouseAngleFromPoint(pointData = {dx: 0, dy: 0}, degrees) {
    // Delta mouse from point
    const dm_point = {
      dx: this.INPUT.mouse.x - pointData.x,
      dy: this.INPUT.mouse.y - pointData.y
    }

    const mouse_angle = Math.atan2(dm_point.dy, dm_point.dx);

    if (degrees) {
      return mouse_angle * 180 / Math.PI;
    }

    return mouse_angle;
  }

  moveHandler(mouseEvent) {
    this.updateMouse(mouseEvent);
  }

  clickHandler(mouseEvent) {
    this.updateMouse(mouseEvent);

    const client = this.SETTINGS.client;

    // Emmit cursor position on click
    client.SETTINGS.socket.emit('player-click', { x: this.INPUT.mouse.x, y: this.INPUT.mouse.y } );
  }
}
