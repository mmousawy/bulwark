export default class BulwarkGame {

  constructor() {
    this.SETTINGS = {};

    return {
      SETTINGS: this.SETTINGS,
      init: this.init.bind(this),
      gameLoop: this.gameLoop.bind(this),
      addPlayer: this.addPlayer.bind(this),
      addCircle: this.addCircle.bind(this)
    }
  }

  init(canvas_holder) {
    this.SETTINGS.holder = canvas_holder;
  }

  gameLoop() {
    player.rotation = bulwark_input.mouseAngleFromPoint({x: 0, y: 0});
    console.log(player.rotation);
  }

  addCircle(data, bRender) {
    console.log('Add circle');
    bRender.SETTINGS.graphics.beginFill(0xA08080);
    bRender.SETTINGS.graphics.drawCircle(data.x, data.y, 10);
    bRender.SETTINGS.graphics.endFill();
  }

  addPlayer(data, bRender) {
    console.log('Add player');
    const player_graphics = new PIXI.Graphics();

    player_graphics.beginFill(0x80A0A0);
    player_graphics.moveTo(0,0);
    player_graphics.lineTo(-15, 30);
    player_graphics.lineTo(15, 30);
    player_graphics.endFill();

    const player = new PIXI.Sprite(player_graphics.generateTexture());
    player.anchor.x = 0.5;
    player.anchor.y = 0.5;

    bRender.SETTINGS.stage.addChild(player);
  }
}
