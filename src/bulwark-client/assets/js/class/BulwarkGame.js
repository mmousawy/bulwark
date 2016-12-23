class BulwarkGame {

  constructor() {
    this.settings = {};

    return {
      settings:  this.settings,
      init:      this.init,
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

    bUI.init(bRender, bGame, bInput, bClient, bUI, bPubSub);
    bClient.init(canvas_holder, bRender, bGame, bInput, bClient, bUI, bPubSub);
  }

  gameLoop() {
    window.requestAnimationFrame(this.settings.bGame.gameLoop.bind(this));

    const logic = this.settings.bGame.logicLoop.bind(this.settings.bGame);
    logic(this.settings.bRender, this.settings.bGame, this.settings.bInput, this.settings.bClient);

    const renderIntro = this.settings.bRender.renderLoopIntro;
    renderIntro(this.settings.bRender, this.settings.bGame, this.settings.bInput, this.settings.bClient);

    /*const render = bRender.renderLoopMain.bind(bRender);
    render(this.settings.bRender, this.settings.bGame, this.settings.bInput, this.settings.bClient);*/

    const input = this.settings.bInput.inputLoop.bind(this.settings.bInput);
    input(this.settings.bRender, this.settings.bGame, this.settings.bInput, this.settings.bClient);

    this.settings.bRender.render();
  }

  logicLoop(bRender, bGame, bInput, bClient) {

    //bClient.settings.current_client.rotation = bInput.mouseAngleFromPoint(bClient.settings.current_client.position);

    if (bRender.settings.current_client) {
      bClient.settings.socket.emit('client-update', {
        id: bClient.settings.current_client.id,
        rotation: bClient.settings.current_client.rotation,
        x: bClient.settings.current_client.x,
        y: bClient.settings.current_client.y
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
