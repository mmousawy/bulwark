class BulwarkRender {

  constructor() {
    this.settings = {};

    return {
      settings: this.settings,
      init: this.init,
      render: this.render,
      addPlayer: this.addPlayer,
      renderLoop: this.renderLoop
    }
  }

  init(stage_size, canvas_holder) {
    // Apply sizes
    this.settings.stage_width = stage_size[0];
    this.settings.stage_height = stage_size[1];

    this.settings.holder = canvas_holder;

    //Create the renderer
    this.settings.renderer = PIXI.autoDetectRenderer(this.settings.stage_width, this.settings.stage_height);

    //Add the canvas to the HTML document
    this.settings.holder.appendChild(this.settings.renderer.view);

    //Create a container object called the 'stage'
    this.settings.stage = new PIXI.Container();
    this.settings.graphics = new PIXI.Graphics();

    this.settings.stage.addChild(this.settings.graphics);
  }

  renderLoop(bRender, bGame, bInput, bClient) {
    for (let player of bClient.settings.players) {
      if (player.id == bClient.settings.current_player.id) {
        if (bRender.settings.current_player) {
          bClient.settings.current_player.rotation = bInput.mouseAngleFromPoint( { x: bRender.settings.current_player.x, y: bRender.settings.current_player.y } );
          player.sprite.rotation = bClient.settings.current_player.rotation;
        }
      } else {
        player.sprite.rotation = player.rotation;
      }
    }

    this.render(bClient);
  }

  addPlayer(data, bRender, is_self) {
    console.log('Add player');
    let player_graphics = new PIXI.Graphics();

    player_graphics.beginFill(0x80A0A0);
    player_graphics.drawCircle(0, 0, 10);
    player_graphics.endFill();

    player_graphics.beginFill(0x202020);
    player_graphics.drawCircle(5, 0, 2);
    player_graphics.endFill();

    const player = new PIXI.Sprite(player_graphics.generateTexture());
    player.anchor.x = 0.5;
    player.anchor.y = 0.5;

    player.x = bRender.settings.stage_width * 0.5;
    player.y = bRender.settings.stage_height * 0.5;

    bRender.settings.stage.addChild(player);

    if (is_self) {
      bRender.settings.current_player = player;
    }

    return player;
  }

  render() {
    this.settings.renderer.render(this.settings.stage);
  }
}
