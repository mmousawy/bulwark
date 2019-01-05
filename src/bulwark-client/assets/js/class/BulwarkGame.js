class BulwarkGame {

  constructor() {
    this.settings = {};

    return {
      settings:  this.settings,
      init:      this.init,
      current_client: this.current_client,
      initGame:  this.initGame.bind(this),
      gameLoop:  this.gameLoop,
      logicLoop: this.logicLoop,
      addCircle: this.addCircle
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
      bInput.init(canvas_holder, bClient);
      bGame.gameLoop(bRender, bGame, bInput, bClient, bUI);
      bClient.listen();
    });

    bPubSub.subscribe("bClient-ready", function() {
      bRender.init([480, 270], canvas_holder, bPubSub);
    });

    //Rooms
    bPubSub.subscribe("create-room-done", function(data) {
      if (data) {
        data.message = `${data.room_owner.nickname} hosted a room with name "${data.room_name}"`;
        bUI.addChatMessage(data, 'server-message');

        bClient.refreshRooms();
      }
    });

    bPubSub.subscribe("join-room-done", function(data) {
      if (data) {
        bClient.settings.current_client.location = data.room_name;
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
        if (data.room_owner.id == bClient.settings.current_client.id) {
          bClient.settings.current_client.location = data.room_name;
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
            room_block.innerHTML = `<span>${room.room_name}</span><div>${room.clients}/4</div>`;

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
        client_id: this.settings.bClient.settings.current_client.id,
        tint: Math.random() * 0xFFFFFF,
        position: {
          x: this.settings.bRender.settings.stage_width * Math.random(),
          y: this.settings.bRender.settings.stage_height * Math.random() * .4
        },
        velocity: {
          x: 0,
          y: 0
        },
        rotation: 0
      };

      this.settings.bClient.settings.socket.emit('spawn', client_data);

      bGame.initGame();
      bUI.removeModal("room");
      bUI.hide();
    });
    
    bUI.init(bRender, bGame, bInput, bClient, bUI, bPubSub);
    bClient.init(canvas_holder, bRender, bGame, bInput, bClient, bUI, bPubSub);
  }

  initGame() {
    this.settings.bRender.scene = "game";
  }

  gameLoop() {
    window.requestAnimationFrame(this.gameLoop.bind(this));

    const logic = this.settings.bGame.logicLoop.bind(this.settings.bGame);
    logic(this.settings.bRender, this.settings.bGame, this.settings.bInput, this.settings.bClient);

    if (this.settings.bRender.settings.scene == "intro") {
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

      const newRotation = bInput.mouseAngleFromPoint(bRender.settings.current_client.position);

      if (newRotation > (bRender.settings.current_client.rotation + .025)
          || newRotation < (bRender.settings.current_client.rotation - .025)) {
        bRender.settings.current_client.rotation = newRotation;

        bClient.settings.socket.emit('client-update', {
          client_id: bClient.settings.current_client.client_id,
          rotation: bRender.settings.current_client.rotation,
          x: bRender.settings.current_client.x,
          y: bRender.settings.current_client.y
        });
      }
    }
  }

  addCircle(data, bRender) {
    console.log('Add circle');
    bRender.settings.graphics.beginFill(0xA08080);
    bRender.settings.graphics.drawCircle(data.x, data.y, 4);
    bRender.settings.graphics.endFill();
  }
}
