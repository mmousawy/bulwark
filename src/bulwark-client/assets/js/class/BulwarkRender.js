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
      addClient:       this.addClient.bind(this),
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
    this.scenes.intro = new PIXI.DisplayObjectContainer();
    this.settings.scene = "intro";

    let star_texture = new PIXI.Graphics();
    star_texture.beginFill(0xffffff);
    star_texture.drawRect(0, 0, 1, 1);
    star_texture.endFill();

    star_texture = star_texture.generateTexture();

    for (let star_index = 0; star_index < this.intro.stars_length; star_index++) {
      let star_sprite = new PIXI.Sprite(star_texture);

      let star_red = 150;
      let star_green = 150;
      let star_blue = 150;

      if (Math.random() < 0.5) {
        star_red += Math.round(Math.random()*100);
        star_green = 150;
        star_blue = 150;
      } else {
        star_red = 100;
        star_green = 100;
        star_blue += Math.round(Math.random()*105);
      }

      let star_color = this.rgbToHex(star_red, star_green, star_blue);

      star_sprite.tint = star_color;

      star_sprite.anchor.x = 0.5;
      star_sprite.anchor.y = 0.5;
      star_sprite.z = 1;
      star_sprite.velocity = {
        x: 0,
        y: (0.25 + (Math.random() * 0.75)) * .05
      };

      star_sprite.position.x = Math.round(Math.random() * this.settings.stage_width);
      star_sprite.position.y = Math.round(Math.random() * this.settings.stage_height);

      star_sprite.scale.x = Math.round(Math.random()*2);
      star_sprite.scale.y = star_sprite.scale.x;

      this.scenes.intro.addChild(star_sprite);

      this.intro.stars.push(star_sprite);
    }

    this.settings.stage.updateLayersOrder();

    let background_texture = PIXI.Texture.fromImage('assets/img/bulwark-intro-background.png');
    let background = new PIXI.Sprite(background_texture);

    background.z = 2;

    this.scenes.intro.addChild(background);

    this.settings.stage.addChild(this.scenes.intro);
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
        star_sprite.alpha = 0.25 + (0.5 + (Math.cos(star_sprite.x + star_sprite.y)) * 0.5) * 0.75;
        star_sprite.position.y -= star_sprite.velocity.y * star_sprite.scale.x;

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
        if (client.client_id == bClient.settings.current_client.client_id) {
          if (bRender.settings.current_client) {
            bClient.settings.current_client.rotation = bInput.mouseAngleFromPoint( { x: bRender.settings.current_client.x, y: bRender.settings.current_client.y } );
            client.sprite.rotation = bClient.settings.current_client.rotation;
          }
        } else {
          client.sprite.rotation = client.rotation;
        }
      }
    }
  }

  addClient(data, bRender, is_self) {
    console.log('Add client');
    let client_graphics = new PIXI.Graphics();

    client_graphics.beginFill(0x80A0A0);
    client_graphics.drawCircle(0, 0, 10);
    client_graphics.endFill();

    client_graphics.beginFill(0x202020);
    client_graphics.drawCircle(5, 0, 2);
    client_graphics.endFill();

    const client = new PIXI.Sprite(client_graphics.generateTexture());
    client.anchor.x = 0.5;
    client.anchor.y = 0.5;

    client.x = bRender.settings.stage_width * 0.5;
    client.y = bRender.settings.stage_height * 0.5;

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
