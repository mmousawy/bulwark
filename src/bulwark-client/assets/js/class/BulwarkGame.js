class BulwarkGame {

  constructor() {
    this.settings = {};

    return {
      settings:  this.settings,
      init:      this.init,
      current_client: this.current_client,
      gameLoop:  this.gameLoop,
      logicLoop: this.logicLoop,
      addShot: this.addShot
    }
  }

  init(canvas_holder, bRender, bGame, bInput, bClient, bUI, bPubSub) {
    this.settings.holder  = canvas_holder;
    this.settings.bRender = bRender;
    this.settings.bGame   = bGame;
    this.settings.bInput  = bInput;
    this.settings.bClient = bClient;
    this.settings.bUI     = bUI;
    this.settings.bPubSub = bPubSub;

    bPubSub.subscribe("refresh", function() {
      window.location.reload();
    });

    bPubSub.subscribe("refresh-clients", function() {
      bClient.refreshClients();
    });

    bPubSub.subscribe("refresh-clients-done", function(data) {
      let clients_count = (Object.keys(data).length);

      let clients_count_signin_elements = document.getElementsByClassName("clients-count-signin");
      let clients_count_elements = document.getElementsByClassName("clients-count");
      let clients_list_elements = document.getElementsByClassName("clients-list");

      for (let i = 0; i < clients_count_signin_elements.length; i++) {
        const player_count = clients_count;
        const suffix_s = (player_count != 1 ? "s" : "");

        clients_count_signin_elements[i].textContent = `${player_count} Player${suffix_s} online`;
      }

      for (let i = 0; i < clients_count_elements.length; i++) {
        clients_count_elements[i].textContent = clients_count;
      }

      for (let i = 0; i < clients_list_elements.length; i++) {
        const node = clients_list_elements[i];
        node.innerHTML = "";

        for (let index in data) {
          if (data.hasOwnProperty(index)) {
            const client = data[index];
            const client_block = document.createElement("div");
            client_block.textContent = client.nickname;
            node.appendChild(client_block);
          }
        }
      }
    });

    bPubSub.subscribe("reconnect", function() {
      bClient.disconnect();
      bClient.connect();
    });

    bPubSub.subscribe("disconnect", function() {
      bClient.disconnect();
    });

    bPubSub.subscribe("connect", function() {
      bClient.connect();
    });

    bPubSub.subscribe("send-chat-message", function(data) {
      bClient.sendChatMessage(data);
    });

    bPubSub.subscribe("new-chat-message", function(data) {
      data.message = `${data.nickname}: ${data.message}`;
      bUI.addChatMessage(data);
    });

    bPubSub.subscribe("signin", function(data) {
      bClient.signin(data);
    });

    bPubSub.subscribe("bRender-ready", function() {
      bInput.init(canvas_holder, bGame, bClient);
      bGame.gameLoop(bRender, bGame, bInput, bClient, bUI);
    });

    bPubSub.subscribe("bClient-ready", function() {
      bClient.listen();
      bRender.init([480, 360], canvas_holder, bPubSub);
    });

    //Rooms
    bPubSub.subscribe("create-room-done", function(data) {
      if (data) {
        data.message = `${data.owner.nickname} hosted a room with name "${data.name}"`;
        bUI.addChatMessage(data, 'server-message');

        bClient.refreshRooms();
      }
    });

    bPubSub.subscribe("join-room-done", function(data) {
      if (data) {
        bClient.settings.current_client.location = data.name;
        bUI.showRoom(data);
        data.message = `You joined the room ${bClient.settings.current_client.location}`;
        bUI.addChatMessage(data, 'server-message-self');
      }
    });

    bPubSub.subscribe("leave-room-done", function(data) {
      bClient.settings.current_client.location = 'main-lobby';
      bUI.showLobby();
      bUI.addChatMessage({message: `You joined the room ${bClient.settings.current_client.location}`}, 'server-message-self');
    });

    bPubSub.subscribe("create-room-self", function(data) {
      if (data) {
        console.log('>>> Room is created');

        if (data.owner.id == bClient.settings.current_client.id) {
          bClient.settings.current_client.location = data.name;
          bUI.showRoom(data);
          data.message = `You joined the room ${bClient.settings.current_client.location}`;
          bUI.addChatMessage(data, 'server-message-self');
        }
      }
    });

    bPubSub.subscribe("refresh-rooms-done", function(data) {
      let clients_count = (Object.keys(data).length);

      let rooms_list_elements = document.getElementsByClassName("rooms-list");

      for (let i = 0; i < rooms_list_elements.length; i++) {
        const node = rooms_list_elements[i];
        node.innerHTML = "";

        for (let index in data) {
          if (data.hasOwnProperty(index)) {
            const room = data[index];
            const room_block = document.createElement("div");
            room_block.setAttribute("data-id", room.id);
            room_block.innerHTML = `<span>${room.name}</span><div>${room.clients}/4</div>`;

            node.addEventListener("click", function(event) {
              bClient.joinRoom({ id: event.target.getAttribute("data-id") });
            });

            node.appendChild(room_block);
          }
        }
      }
    });

    //Game
    bPubSub.subscribe("start-game", () => {
      console.log(">>> Starting game!");

      const client_data = {
        id: this.settings.bClient.settings.current_client.id,
        tint: Math.random() * 0xFFFFFF,
        position: {
          x: -32 + this.settings.bRender.settings.stage_width / (1 + 1), // divide by 1 + players in room
          y: this.settings.bRender.settings.stage_height * Math.random() * .4
        },
        velocity: {
          x: 0,
          y: 0
        },
        rotation: 0
      };

      this.settings.bClient.settings.socket.emit('spawn', client_data);

      bRender.initMatch();
      bUI.removeModal("room");
      bUI.hide();
    });

    // Stop game
    bPubSub.subscribe("stop-game", () => {
      console.log(">>> Stopping game!");

      bRender.destroyMatch();
      bRender.initIntro();
      bUI.show();
      bUI.showRoom();
    });

    bUI.init(bRender, bGame, bInput, bClient, bUI, bPubSub);
    bClient.init(canvas_holder, bRender, bGame, bInput, bClient, bUI, bPubSub);
  }

  gameLoop() {
    window.requestAnimationFrame(this.gameLoop.bind(this));

    const logic = this.settings.bGame.logicLoop.bind(this.settings.bGame);
    logic(this.settings.bRender, this.settings.bGame, this.settings.bInput, this.settings.bClient);

    if (this.settings.bRender.settings.scene == 'intro') {
      const renderIntro = this.settings.bRender.renderLoopIntro;
      renderIntro(this.settings.bRender, this.settings.bGame, this.settings.bInput, this.settings.bClient);
    }

    const render = bRender.renderLoopMain.bind(bRender);
    render(this.settings.bRender, this.settings.bGame, this.settings.bInput, this.settings.bClient);

    const input = this.settings.bInput.inputLoop.bind(this.settings.bInput);
    input(this.settings.bRender, this.settings.bGame, this.settings.bInput, this.settings.bClient);

    this.settings.bRender.render();
  }

  logicLoop(bRender, bGame, bInput, bClient) {

    if (bRender.settings.current_client) {
      const newRotation = bInput.mouseAngleFromPoint({
        x: bRender.settings.current_client.position.x + bRender.settings.current_client.gun.position.x * .5,
        y: bRender.settings.current_client.position.y + bRender.settings.current_client.gun.position.y * .5
      });

      // if (newRotation > (bRender.settings.current_client.gun.rotation + .025)
      //     || newRotation < (bRender.settings.current_client.gun.rotation - .025)) {
        bRender.settings.current_client.gun.rotation = newRotation;

        bClient.settings.socket.emit('client-update', {
          id: bClient.settings.current_client.id,
          rotation: bRender.settings.current_client.gun.rotation,
          x: bRender.settings.current_client.x,
          y: bRender.settings.current_client.y
        });
      // }
    }
  }

  addShot(data, bRender) {
    let client;

    if (this.settings.bClient.settings.clients_ids[data.id]) {
      client = this.settings.bClient.settings.clients_ids[data.id];
    } else {
      return false;
    }

    const pointData = {
      x: client.sprite.position.x + client.sprite.gun.position.x * .5,
      y: client.sprite.position.y + client.sprite.gun.position.y * .5
    };

    const sfx = this.settings.bUI.playSound('shot1');
    this.settings.bUI.sounds.shot1.rate(1 + (Math.random() - Math.random()) * .1, sfx);

    const spatialPos = {
      x: ((pointData.x - (this.settings.bRender.settings.stage_width * .5)) / (this.settings.bRender.settings.stage_width * .5)).toFixed(2),
      y: ((pointData.y - (this.settings.bRender.settings.stage_height * .5)) / (this.settings.bRender.settings.stage_height * .5)).toFixed(2)
    };

    console.log(spatialPos.x);

    this.settings.bUI.sounds['shot1'].pos(spatialPos.x, 0, 0, sfx);

    client.sprite.gun.velocity.x -= 5 * Math.cos(client.sprite.gun.rotation);
    client.sprite.gun.velocity.y -= 5 * Math.sin(client.sprite.gun.rotation);

    const beam_container = new PIXI.Container();
    beam_container.rotation = client.sprite.gun.rotation;
    beam_container.position.x = pointData.x;
    beam_container.position.y = pointData.y;

    const dm_point = {
      dx: data.x - pointData.x,
      dy: data.y - pointData.y
    };

    const distance = Math.round(Math.sqrt(dm_point.dx * dm_point.dx + dm_point.dy * dm_point.dy)) - 36;

    const beam_mask = new PIXI.Sprite.from(bRender.sprites.energy_beam_mask.texture);
    beam_mask.anchor.y = .5;
    beam_mask.position.x = 0;
    beam_mask.scale.x = 2;
    beam_mask.scale.y = .75;

    const beam = new PIXI.TilingSprite(bRender.sprites.energy_beam.texture, distance + 10, 32);
    beam.mask = beam_mask;
    beam.anchor.y = .5;
    beam.position.x = 30;
    beam_container.blendMode = PIXI.BLEND_MODES.SCREEN;
    beam.tileTransform.position.x = Math.round(Math.random() * 32);

    const muzzle_flash = new PIXI.Sprite.from(bRender.sprites.muzzle_flash.texture);
    muzzle_flash.rotation = client.sprite.gun.rotation;
    muzzle_flash.position.x = pointData.x + 32 * Math.cos(client.sprite.gun.rotation);
    muzzle_flash.position.y = pointData.y + 32 * Math.sin(client.sprite.gun.rotation);;;
    muzzle_flash.anchor.x = 0;
    muzzle_flash.anchor.y = .5;
    muzzle_flash.scale.x = Math.random() * .5 + .5;
    muzzle_flash.scale.y = muzzle_flash.scale.x;

    if (Math.random() < .5) {
      muzzle_flash.scale.y *= -1;
    }

    muzzle_flash.ttl = 2;
    muzzle_flash.blendMode = PIXI.BLEND_MODES.SCREEN;

    muzzle_flash.animate = function() {
      if (this.ttl == 1) {
        this.scale.x *= .75;
        this.scale.y *= .75;
      }
    }

    beam_container.addChild(beam_mask);
    beam_container.addChild(beam);

    beam_container.ttl = Math.round(distance * .05);
    bRender.settings.particles2.addChild(beam_container);
    beam_container.distance = distance;
    beam_container.translateRate = beam_container.distance / beam_container.ttl;
    bRender.settings.particles2.addChild(muzzle_flash);

    const beam_impact = new PIXI.Sprite.from(bRender.sprites.energy_beam_impact2.texture);
    beam_impact.scale.x = 1.5;
    beam_impact.scale.y = 1.5;
    beam_impact.visible = false;
    beam_impact.position.x = data.x
    beam_impact.position.y = data.y;
    beam_impact.blendMode = PIXI.BLEND_MODES.SCREEN;
    beam_impact.anchor.x = .5;
    beam_impact.anchor.y = .5;
    beam_impact.animationDuration = 50;
    beam_impact.maxTtl = beam_container.ttl + beam_impact.animationDuration;
    beam_impact.ttl = beam_impact.maxTtl;
    beam_impact.scaleRate = 1 - (1 / this.animationDuration);
    beam_impact.bUI = this.settings.bUI;
    bRender.settings.particles2.addChild(beam_impact);

    const beam_impact_sparks = [];

    // Impact sparks
    for (let i = 0; i < 20; i++) {
      const spark = new PIXI.Sprite.from(bRender.sprites[`spark${Math.round(Math.random() * 2) + 1}`].texture);
      spark.blendMode = PIXI.BLEND_MODES.SCREEN;
      spark.position.x = data.x + (Math.random() - Math.random()) * 20;
      spark.position.y = data.y + (Math.random() - Math.random()) * 20;
      spark.anchor.x = .5;
      spark.anchor.y = .5;
      spark.scale.y = spark.scale.x = Math.random() * .5 + .25;
      spark.animationDuration = Math.round(Math.random() * 10 + 10);
      spark.ttl = beam_container.ttl + spark.animationDuration;
      spark.visible = false;

      const velocityMultiplier = 15;

      spark.velocity = {
        x: (Math.random() - Math.random()) * velocityMultiplier,
        y: (Math.random() - Math.random()) * velocityMultiplier,
        r: (Math.random() - Math.random()) * velocityMultiplier * .2
      };

      spark.animate = function() {
        if (this.ttl == this.animationDuration) {
          this.visible = true;
        }

        if (this.ttl < this.animationDuration) {
          this.position.x += this.velocity.x;
          this.position.y += this.velocity.y;
          this.rotation += this.velocity.r;
          this.scale.x = this.scale.y *= .98;

          this.velocity.x *= .9;
          this.velocity.y *= .9;
        }

        this.alpha = Math.round(Math.random() * 2);
      }

      bRender.settings.particles2.addChild(spark);
      beam_impact_sparks.push(spark);
    }

    // Beam sparks
    beam_container.animate = function() {
      this.children[0].position.x += this.translateRate;

      const spark = new PIXI.Sprite.from(bRender.sprites[`spark${Math.round(Math.random() * 2) + 1}`].texture);
      spark.blendMode = PIXI.BLEND_MODES.SCREEN;
      spark.position.x = pointData.x + ((this.children[0].position.x + 60) * Math.cos(this.rotation));
      spark.position.y = pointData.y + ((this.children[0].position.x + 60) * Math.sin(this.rotation));
      spark.anchor.x = .5;
      spark.anchor.y = .5;
      spark.scale.x = Math.random() * .5 + .25;
      spark.scale.y = spark.scale.x;
      spark.ttl = Math.round(Math.random() * 10 + 5);

      const velocityMultiplier = 5;

      spark.velocity = {
        x: (Math.random() - Math.random()) * 3 + velocityMultiplier * Math.cos(this.rotation),
        y: (Math.random() - Math.random()) * 3 + velocityMultiplier * Math.sin(this.rotation),
        r: (Math.random() - Math.random()) * velocityMultiplier * .2
      };

      spark.animate = function() {
        this.position.x -= this.velocity.x;
        this.position.y -= this.velocity.y;
        this.rotation += this.velocity.r;
        this.scale.x = this.scale.y *= .95;
        this.velocity.x *= .95;
        this.velocity.y *= .95;
      }

      bRender.settings.particles2.addChild(spark);
      beam_impact_sparks.push(spark);
    };

    beam_impact.animate = function() {
      if (this.ttl == this.animationDuration) {
        bRender.settings.stage.filters[0].enabled = true;
        this.brighter = true;
        this.visible = true;

        const sfx = this.bUI.playSound('no-impact');
        this.bUI.sounds['no-impact'].rate(1 + (Math.random() - Math.random()) * .1, sfx);

        const spatialPos = {
          x: (this.position.x - (bRender.settings.stage_width * .5)) / (bRender.settings.stage_width * .5),
          y: (this.position.y - (bRender.settings.stage_height * .5)) / (bRender.settings.stage_height * .5)
        };

        this.bUI.sounds['no-impact'].pos(spatialPos.x, spatialPos.y, 0, sfx);
      }

      if (this.ttl < this.animationDuration) {
        if (this.brighter) {
          bRender.settings.stage.filters[0].enabled = false;
        }

        this.scale.x = this.scale.y *= this.scaleRate;
      }
    };
  }
}
