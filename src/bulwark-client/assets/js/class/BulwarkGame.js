class BulwarkGame {

  constructor() {
    this.settings = {};

    return {
      settings: this.settings,
      init: this.init,
      gameLoop: this.gameLoop,
      logicLoop: this.logicLoop,
      addCircle: this.addCircle
    }
  }

  init(canvas_holder, bRender, bGame, bInput, bClient) {
    this.settings.holder = canvas_holder;
    this.settings.bRender = bRender;
    this.settings.bGame = bGame;
    this.settings.bInput = bInput;
    this.settings.bClient = bClient;
  }

  gameLoop() {
    window.requestAnimationFrame(bGame.gameLoop.bind(this));

    const logic = bGame.logicLoop.bind(bGame);
    logic(this.settings.bRender, this.settings.bGame, this.settings.bInput, this.settings.bClient);

    const render = bRender.renderLoop.bind(bRender);
    render(this.settings.bRender, this.settings.bGame, this.settings.bInput, this.settings.bClient);

    const input = bInput.inputLoop.bind(bInput);
    input(this.settings.bRender, this.settings.bGame, this.settings.bInput, this.settings.bClient);
  }

  logicLoop(bRender, bGame, bInput, bClient) {
    if (bRender.settings.current_player) {
      bClient.settings.socket.emit('player-update', {
        id: bClient.settings.current_player.id,
        rotation: bClient.settings.current_player.rotation,
        x: bClient.settings.current_player.x,
        y: bClient.settings.current_player.y
      });
    }
  }

  addCircle(data, bRender) {
    console.log('Add circle');
    bRender.settings.graphics.beginFill(0xA08080);
    bRender.settings.graphics.drawCircle(data.x, data.y, 10);
    bRender.settings.graphics.endFill();
  }
}
