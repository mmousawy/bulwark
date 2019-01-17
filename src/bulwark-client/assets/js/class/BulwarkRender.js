class BulwarkRender {

  constructor() {
    this.settings = {
      scene: null
    };
    
    this.scenes = {};

    this.intro = {
      stars: [],
      stars_length: 200
    }

    return {
      settings:        this.settings,
      scenes:          this.scenes,
      scene:           this.scene,
      init:            this.init.bind(this),
      render:          this.render.bind(this),
      createPlayerSprite: this.createPlayerSprite.bind(this),
      renderLoopMain:  this.renderLoopMain.bind(this),
      renderLoopIntro: this.renderLoopIntro.bind(this),
      initIntro:       this.initIntro.bind(this)
    }
  }

  init(stage_size, canvas_holder, bPubSub) {
    this.settings.bPubSub = bPubSub;

    // Apply sizes
    this.settings.stage_width = stage_size[0];
    this.settings.stage_height = stage_size[1];

    this.settings.holder = canvas_holder;

    // PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

    //Create the renderer
    this.settings.renderer = PIXI.autoDetectRenderer(this.settings.stage_width, this.settings.stage_height, false, false);

    this.settings.renderer.backgroundColor = 0x000D16;

    //Add the canvas to the HTML document
    this.settings.holder.appendChild(this.settings.renderer.view);

    //Create a container object called the 'stage'
    this.settings.stage = new PIXI.Container();
    this.settings.graphics = new PIXI.Graphics();

    this.settings.stage.updateLayersOrder = function () {
      this.children.sort(function(a,b) {
        a.z = a.z || 0;
        b.z = b.z || 0;
        return a.z - b.z;
      });
    };

    this.settings.stage.addChild(this.settings.graphics);

    this.settings.bPubSub.publish("bRender-ready");
  }

  initIntro() {
    this.scenes.intro = new PIXI.Container();
    this.settings.scene = "intro";

    let star_texture = PIXI.Texture.WHITE;

    for (let star_index = 0; star_index < this.intro.stars_length; star_index++) {
      let star_sprite = new PIXI.Sprite(star_texture);

      star_sprite.scale.x = star_sprite.scale.y = .1 * Math.ceil(Math.random()*2);

      let star_red = 150;
      let star_green = 150;
      let star_blue = 150;

      if (Math.random() < .5) {
        star_red += Math.round(Math.random()*10);
        star_green = 150;
        star_blue = 150;
      } else {
        star_red = 100;
        star_green = 100;
        star_blue += Math.round(Math.random()*25);
      }

      let star_color = this.rgbToHex(star_red, star_green, star_blue);

      star_sprite.tint = star_color;

      star_sprite.anchor.x = 0.5;
      star_sprite.anchor.y = 0.5;
      star_sprite.z = 1;
      star_sprite.velocity = {
        x: 0,
        y: (0.25 + (Math.random() * 2)) * .5
      };

      star_sprite.position.x = Math.round(Math.random() * this.settings.stage_width);
      star_sprite.position.y = Math.round(Math.random() * this.settings.stage_height);

      this.scenes.intro.addChild(star_sprite);

      this.intro.stars.push(star_sprite);
    }

    this.settings.stage.updateLayersOrder();

    let background_texture = PIXI.Texture.fromImage('assets/img/bulwark-intro-background.png');
    let background = new PIXI.Sprite(background_texture);

    background.z = 2;

    this.scenes.intro.addChild(background);

    this.settings.stage.addChild(this.scenes.intro);

    // Player sprite testing
    // const data = {
    //   client_id: "5qu1",
    //   position: {x: 100, y: 214},
    // };

    // const client_sprite = bRender.createPlayerSprite(data, bRender, true);
    // bClient.addClient(data, client_sprite, true);

    // bUI.hide();
  }

  componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }

  rgbToHex(r, g, b) {
    return '0x' + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
  }

  renderLoopIntro(bRender, bGame, bInput, bClient) {
    for (let star_index = 0; star_index < this.intro.stars_length; star_index++) {
      let star_sprite = this.intro.stars[star_index];

      if (star_sprite) {
        star_sprite.alpha = 0.25 + (0.5 + (Math.cos(star_sprite.x + star_sprite.y * .25)) * 0.5) * 0.75;
        star_sprite.position.y -= (star_sprite.velocity.y * star_sprite.scale.x * star_sprite.scale.x) * 5;

        if (star_sprite.position.x < 0) {
          star_sprite.position.x = this.settings.stage_width;
          star_sprite.position.y = Math.round(Math.random() * this.settings.stage_height);
        }

        if (star_sprite.position.y < 0) {
          star_sprite.position.x = Math.round(Math.random() * this.settings.stage_width);
          star_sprite.position.y = this.settings.stage_height;
        }
      }
    }
  }

  renderLoopMain(bRender, bGame, bInput, bClient) {
    if (bClient.settings.clients) {
      for (let client of bClient.settings.clients) {
        if (client.client_id !== bClient.settings.current_client.client_id) {
          client.sprite.gun.rotation = client.rotation;
        }
      }
    }
  }

  createPlayerSprite(data, bRender, is_self) {
    console.log('Add client');
    let client_graphics = new PIXI.Graphics();

    client_graphics.beginFill(0x80A0A0);
    client_graphics.drawCircle(0, 0, 10);
    client_graphics.endFill();

    client_graphics.beginFill(0x202020);
    client_graphics.drawCircle(5, 0, 2);
    client_graphics.endFill();

    // const client = new PIXI.Sprite(this.settings.renderer.generateTexture(client_graphics));
    const client = new PIXI.Container();

    const base = new PIXI.Sprite.from('assets/img/cannon-01-base.png');
    const gun = new PIXI.Sprite.from('assets/img/cannon-01-gun.png');

    gun.position.x = 52;
    gun.position.y = 3;

    client.addChild(base);
    client.addChild(gun);

    client.gun = gun;

    gun.anchor.x = 0.175;
    gun.anchor.y = 0.5;

    client.x = data.position.x || bRender.settings.stage_width * Math.random();
    client.y = 214;

    bRender.settings.stage.addChild(client);

    if (is_self) {
      bRender.settings.current_client = client;
    }

    return client;
  }

  render() {
    this.settings.renderer.render(this.settings.stage);
  }
}
