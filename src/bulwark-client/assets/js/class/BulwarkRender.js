class BulwarkRender {

  constructor() {
    this.settings = {
      scene: null
    };

    this.scenes = {};

    this.intro = {
      stars: [],
      stars_length: 200
    };

    this.sprites = {};

    return {
      settings:        this.settings,
      scenes:          this.scenes,
      sprites:         this.sprites,
      init:            this.init.bind(this),
      render:          this.render.bind(this),
      createPlayerSprite: this.createPlayerSprite.bind(this),
      createEnemySprite: this.createEnemySprite.bind(this),
      renderLoopMain:  this.renderLoopMain.bind(this),
      renderLoopIntro: this.renderLoopIntro.bind(this),
      initMatch:       this.initMatch.bind(this)
    }
  }

  init(stage_size, canvas_holder, bPubSub) {
    this.settings.bPubSub = bPubSub;

    // Apply sizes
    this.settings.stage_width = stage_size[0];
    this.settings.stage_height = stage_size[1];

    this.settings.holder = canvas_holder;

    // PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

    this.settings.loader = PIXI.Loader.shared;

    PIXI.settings.ROUND_PIXELS = true;

    //Create the renderer
    this.settings.renderer = new PIXI.Application({
      width: this.settings.stage_width,
      height: this.settings.stage_height
    });

    //Add the canvas to the HTML document
    this.settings.holder.appendChild(this.settings.renderer.view);

    //Create a container object called the 'stage'
    this.settings.stage = this.settings.renderer.stage;
    this.settings.stage.updateLayersOrder = function() {
      this.children.sort(function(a, b) {
        a.z = a.z || 0;
        b.z = b.z || 0;
        return a.z - b.z;
      });
    };

    // Create background
    const backgroundTexture = new PIXI.Graphics().beginFill(0x000D16).drawRect(0,0, this.settings.stage_width, this.settings.stage_height).endFill();
    this.settings.stage.addChild(backgroundTexture);

    let colorMatrix = new PIXI.filters.ColorMatrixFilter();
    this.settings.stage.filters = [colorMatrix];
    colorMatrix.enabled = false;
    colorMatrix.brightness(1.2);

    this.initAssets()
    .then(resolve => {
      this.settings.bPubSub.publish("bRender-ready");
      this.initIntro();
    });
  }

  initAssets() {
    return new Promise((resolve, reject) => {
      this.settings.loader.add('bulwark_intro_background', 'assets/img/bulwark-intro-background.png');
      this.settings.loader.add('ground', 'assets/img/ground.png');
      this.settings.loader.add('energy_beam', 'assets/img/energy-beam.png');
      this.settings.loader.add('energy_beam_mask', 'assets/img/energy-beam-mask.png');
      this.settings.loader.add('energy_beam_impact', 'assets/img/energy-beam-impact.png');
      this.settings.loader.add('energy_beam_impact2', 'assets/img/energy-beam-impact2.png');
      this.settings.loader.add('energy_beam_impact_reverse', 'assets/img/energy-beam-impact-reverse.png');
      this.settings.loader.add('muzzle_flash', 'assets/img/muzzle-flash.png');
      this.settings.loader.add('cannon_01_base', 'assets/img/cannon-01-base.png');
      this.settings.loader.add('cannon_01_gun', 'assets/img/cannon-01-gun.png');
      this.settings.loader.add('spark1', 'assets/img/spark1.png');
      this.settings.loader.add('spark2', 'assets/img/spark2.png');
      this.settings.loader.add('spark3', 'assets/img/spark3.png');
      this.settings.loader.add('asteroid', 'assets/img/asteroid.png');
      this.settings.loader.add('asteroid2', 'assets/img/asteroid2.png');

      this.settings.loader.load((loader, resources) => {
        Object.keys(resources).forEach((resource_name, index) => {
          const resource = resources[resource_name];
          this.sprites[resource_name] = new PIXI.Sprite(resource.texture);
        });

        resolve();
      });
    });
  }

  initIntro() {
    this.scenes.intro = new PIXI.Container();
    this.scenes.intro.z = 1;
    this.settings.scene = 'intro';

    let star_texture = PIXI.Texture.WHITE;

    for (let star_index = 0; star_index < this.intro.stars_length; star_index++) {
      let star_sprite = new PIXI.Sprite(star_texture);

      star_sprite.width = star_sprite.height = Math.round(Math.random() * 2);

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

    let background = this.sprites.bulwark_intro_background;
    background.position.y = 90;

    background.z = 2;

    this.scenes.intro.addChild(background);

    this.settings.stage.addChild(this.scenes.intro);

    // Player sprite testing
    // const data = {
    //   id: "5qu1",
    //   position: {x: 100, y: 214},
    // };

    // const client_sprite = bRender.createPlayerSprite(data, bRender, true);
    // bClient.addClient(data, client_sprite, true);

    // bUI.hide();

    this.settings.stage.updateLayersOrder();

    // Force game start
    // bClient.settings.current_client = {
    //   nickname: 'test' + Math.round(Math.random() * 1000)
    // };

    // bClient.signin(bClient.settings.current_client);

    // bClient.createRoom({
    //   name: 'debug'
    // });

    // bClient.startGame();
  }

  initMatch() {
    if (this.settings.scene == 'intro') {
      this.scenes.intro.destroy();
      delete this.scenes.intro;
    }

    this.settings.enemies = new PIXI.Container();
    this.settings.enemies.z = 3;

    this.settings.players = new PIXI.Container();
    this.settings.players.z = 4;

    this.settings.particles = new PIXI.Container();
    this.settings.particles.z = 5;

    this.settings.particles2 = new PIXI.Container();
    this.settings.particles2.z = 6;

    let ground = this.sprites.ground;
    ground.position.y = 242;
    ground.z = 7;

    this.scenes.match = new PIXI.Container();
    this.scenes.match.z = 1;
    this.settings.scene = 'match';

    this.scenes.match.addChild(this.settings.players);
    this.scenes.match.addChild(this.settings.enemies);
    this.scenes.match.addChild(this.settings.particles);
    this.scenes.match.addChild(this.settings.particles2);
    this.scenes.match.addChild(ground);
    this.settings.stage.addChild(this.scenes.match);
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
        star_sprite.position.y -= (star_sprite.velocity.y * star_sprite.width * star_sprite.width) * .05;

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
    if (this.settings.scene == 'match') {
      if (bClient.settings.clients) {
        for (let client of bClient.settings.clients) {
          client.sprite.gun.velocity.x += (client.sprite.gun.startPosition.x - client.sprite.gun.position.x) * .1;
          client.sprite.gun.velocity.y += (client.sprite.gun.startPosition.y - client.sprite.gun.position.y) * .1;

          client.sprite.gun.position.x += client.sprite.gun.velocity.x;
          client.sprite.gun.position.y += client.sprite.gun.velocity.y;

          client.sprite.gun.velocity.x *= .8;
          client.sprite.gun.velocity.y *= .8;

          if (client.id !== bClient.settings.current_client.id) {
            client.sprite.gun.rotation = client.rotation;
          }
        }
      }

      bRender.settings.particles.children.forEach(particle => {
        if (particle.ttl == 0) {
          particle.destroy();
        } else {
          particle.animate && particle.animate();
          particle.ttl--;
        }
      });

      bRender.settings.particles2.children.forEach(particle => {
        if (particle.ttl == 0) {
          particle.destroy();
        } else {
          particle.animate && particle.animate();
          particle.ttl--;
        }
      });

      bRender.settings.enemies.children.forEach(enemy => {
        if (enemy.health == 0) {
          enemy.destroy();
        } else {
          enemy.animate && enemy.animate();
        }
      });
    }
  }

  createPlayerSprite(data, bRender, is_self) {
    const client = new PIXI.Container();
    client.scale.x = .5;
    client.scale.y = .5;

    const base = new PIXI.Sprite.from(this.sprites.cannon_01_base.texture);
    const gun = new PIXI.Sprite.from(this.sprites.cannon_01_gun.texture);

    gun.position.x = 62;
  gun.position.y = 72;
    gun.velocity = {
      x: 0,
      y: 0
    };

    gun.startPosition = {
      x: 62,
      y: 72
    };

    client.addChild(base);
    client.addChild(gun);
    client.z = 5;

    client.gun = gun;

    gun.anchor.x = 0.175;
    gun.anchor.y = 0.475;

    client.x = data.position.x || bRender.settings.stage_width * Math.random();
    client.y = 275;

    bRender.settings.players.addChild(client);

    if (is_self) {
      bRender.settings.current_client = client;
    }

    return client;
  }

  createEnemySprite(data, bRender, is_self) {
    const enemy = new PIXI.Container();
    enemy.scale.x = .5;
    enemy.scale.y = .5;

    const base = new PIXI.Sprite.from(this.sprites.asteroid2.texture);

    enemy.addChild(base);

    base.anchor.x = .5;
    base.anchor.y = .5;

    enemy.x = data.position.x;
    enemy.y = data.position.y;

    bRender.settings.enemies.addChild(enemy);

    if (is_self) {
      bRender.settings.current_enemy = enemy;
    }

    return enemy;
  }

  render() {
    this.settings.renderer.render(this.settings.stage);
  }
}
