class BulwarkClient {

  constructor() {
    this.settings = {};

    return {
      settings: this.settings,
      init: this.init.bind(this),
      listen: this.listen.bind(this)
    }
  }

  init() {
    // Connect to server
    this.settings.socket = io('http://127.0.0.1:3000/');
    this.settings.players = [];
    this.settings.players_ids = [];
  }

  listen(bRender, bGame, bInput, bClient) {
    // Listen to the following...
    this.settings.socket.on('connect', function(){});

    this.settings.socket.on('player-click', function(data) {
      bGame.addCircle(data, bRender);
    });

    this.settings.socket.on('player-join', (data) => {
      const callback = this.handlePlayerJoin.bind(this)
      callback(data);
    });

    this.settings.socket.on('player-update', (data) => {
      const callback = this.handlePlayerUpdate.bind(this)
      callback(data);
    });

    this.settings.socket.on('self-join', (data) => {
      const callback = this.handleSelfJoin.bind(this)
      callback(data);
    });

    this.settings.socket.on('event', function(data){});

    this.settings.socket.on('disconnect', function(){});
  }

  handlePlayerJoin(data) {
    const player_sprite = bRender.addPlayer(data, bRender);
    this.addClient(data, player_sprite);
  }

  handleSelfJoin(data) {
    const player_sprite = bRender.addPlayer(data, bRender, true);
    this.addClient(data, player_sprite, true);
  }

  handlePlayerUpdate(data) {
    if (this.settings.players_ids[data.id]) {
      const player = this.settings.players_ids[data.id];

      player.rotation = data.rotation;
      player.x = data.x;
      player.y = data.y;
    }
  }

  addClient(data, player_sprite, is_self) {
    data.sprite = player_sprite;
    data.rotation = 0;
    data.x = 0;
    data.y = 0;

    const players_size = this.settings.players.push(data);
    this.settings.players_ids[data.id] = this.settings.players[players_size-1];

    console.log(data.id, this.settings.players_ids[data.id]);

    if (is_self) {
      this.settings.current_player = data;
      console.log(`You have joined with id: ${data.id}`);
    }
  }
}
