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

  init(canvas_holder, bGame, bClient) {
    this.settings.holder = canvas_holder;
    this.settings.bGame = bGame;
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
    };

    let mouse_angle = Math.atan2(dm_point.dy, dm_point.dx);

    if (dm_point.dx < 0) {
      if (mouse_angle > 0 && mouse_angle < Math.PI - .5) {
        mouse_angle = Math.PI - .5;
      }
    } else {
      if (mouse_angle > .5) {
        mouse_angle = .5;
      }
    }

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

    if (this.settings.bGame.settings.bRender.settings.scene !== 'match'
      || this.INPUT.mouse.y > 330) {
      return;
    }

    const client = this.settings.bClient.settings.current_client;

    const pointData = {
      x: client.sprite.position.x + client.sprite.gun.position.x * .5,
      y: client.sprite.position.y + client.sprite.gun.position.y * .5
    };

    const dm_point = {
      dx: this.INPUT.mouse.x - pointData.x,
      dy: this.INPUT.mouse.y - pointData.y
    };

    const distance = Math.sqrt(dm_point.dx * dm_point.dx + dm_point.dy * dm_point.dy) - 36;

    if (distance < 10) {
      return;
    }

    const bClient = this.settings.bClient;

    // Emmit cursor position on click
    bClient.settings.socket.emit('client-click', {
      id: client.id,
      x: this.INPUT.mouse.x,
      y: this.INPUT.mouse.y,
      distance
    });
  }

  inputLoop() {
    // Nothing here yet
  }
}
