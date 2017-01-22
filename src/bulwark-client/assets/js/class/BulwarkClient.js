class BulwarkClient {

  constructor() {
    this.settings = {};

    return {
      settings: this.settings,
      init: this.init.bind(this),
      connect: this.connect.bind(this),
      disconnect: this.disconnect.bind(this),
      createRoom: this.createRoom.bind(this),
      joinRoom: this.joinRoom.bind(this),
      leaveRoom: this.leaveRoom.bind(this),
      
      startGame: this.startGame.bind(this),
      signin: this.signin.bind(this),
      refreshClients: this.refreshClients.bind(this),
      refreshRooms: this.refreshRooms.bind(this),
      sendChatMessage: this.sendChatMessage.bind(this),
      listen: this.listen.bind(this)
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

    // Connect to server
    if (typeof io !== "undefined") {
      this.connect();
    } else {
      bUI.createModal('offline');
    }
  }

  connect() {
    console.log("Initializing socket");
    this.settings.socket = io('http://127.0.0.1:3000/', { 'force new connection': true });
    this.settings.clients = null;
    this.settings.clients_ids = [];
    this.settings.current_client = null;

    this.settings.bPubSub.publish("bClient-ready");
  }

  disconnect() {
    console.log("Disconnecting socket");
    if (this.settings.socket) {
      console.log(this.settings.socket);
    }
  }

  signin(data) {
    console.log("Attempting signin with client:", data.nickname);
    this.settings.socket.emit('client-signin', data);
  }

  listen() {
    // Listen to the following...
    this.settings.socket.on('connect', (data) => {
      console.log("Connected to server");

      if (!this.settings.current_player) {
        this.settings.bRender.initIntro();
        //this.settings.bUI.playSound('intro');
        this.settings.bUI.createModal('signin');
      }
    });

    this.settings.socket.on('new-chat-message', (data) => {
      this.settings.bPubSub.publish("new-chat-message", data);
    });

    this.settings.socket.on('clients-list', (data) => {
      this.settings.clients_list = data;
      this.settings.bPubSub.publish("refresh-clients-done", data);
    });

    this.settings.socket.on('client-signin', (data) => {
      this.handleClientSignin(data);
    });

    this.settings.socket.on('client-signoff', (data) => {
      console.log(data);
      this.handleClientSignoff(data);
    });

    this.settings.socket.on('self-signin', (data) => {
      const callback = this.handleSelfSignin.bind(this);
      callback(data);
    });

    this.settings.socket.on('client-click', (data) => {
      this.settings.bGame.addCircle(data, bRender);
    });

    this.settings.socket.on('client-join', (data) => {
      const callback = this.handleClientJoin.bind(this);
      callback(data);
    });

    this.settings.socket.on('client-leave', (data) => {
      const callback = this.handleClientLeave.bind(this);
      callback(data);
    });

    this.settings.socket.on('client-update', (data) => {
      const callback = this.handleClientUpdate.bind(this);
      callback(data);
    });

    this.settings.socket.on('self-join', (data) => {
      const callback = this.handleSelfJoin.bind(this);
      callback(data);
    });

    //Rooms
    this.settings.socket.on('rooms-list', (data) => {
      this.settings.rooms_list = data;
      this.settings.bPubSub.publish("refresh-rooms-done", data);
    });

    this.settings.socket.on('join-room-done', (data) => {
      const callback = this.handleJoinRoomDone.bind(this);
      callback(data);
    });

    this.settings.socket.on('create-room-done', (data) => {
      const callback = this.handleCreateRoomDone.bind(this);
      callback(data);
    });

    this.settings.socket.on('create-room-self', (data) => {
      this.settings.bPubSub.publish("create-room-self", data);
    });

    this.settings.socket.on('leave-room-done', (data) => {
      this.settings.bPubSub.publish("leave-room-done", data);
    });

    //Game
    this.settings.socket.on('start-game', () => {
      this.settings.bPubSub.publish("start-game");
    });

  }

  refreshClients() {
    this.settings.socket.emit('clients-list');
    console.log("Refreshing clients");
  }

  refreshRooms() {
    this.settings.socket.emit('rooms-list');
    console.log("Refreshing rooms");
  }

  handleClientJoin(data) {
    data.message = `${data.nickname} joined the room`;
    this.settings.bUI.addChatMessage(data, 'server-message');
    //const client_sprite = bRender.addClient(data, bRender);
    //this.addClient(data, client_sprite);
  }

  handleClientLeave(data) {
    data.message = `${data.nickname} left the room`;
    this.settings.bUI.addChatMessage(data, 'server-message');
    //const client_sprite = bRender.addClient(data, bRender);
    //this.addClient(data, client_sprite);
  }

  handleSelfJoin(data) {
    const client_sprite = bRender.addClient(data, bRender, true);
    this.addClient(data, client_sprite, true);
  }

  handleClientSignin(data) {
    data.message = `${data.nickname} logged in`;
    this.settings.bUI.addChatMessage(data, 'server-message');
  }

  handleClientSignoff(data) {
    data.message = `${data.nickname} logged out`;
    this.settings.bUI.addChatMessage(data, 'server-message');
  }

  sendChatMessage(data) {
    data.nickname = this.settings.current_client.nickname;

    console.log("Sending chat message with:", data.nickname, data.message);

    this.settings.socket.emit('chat-message', data);
  }

  handleSelfSignin(data) {
    console.log("Signed in!");
    this.settings.current_client = data;

    this.settings.bUI.showLobby();

    data.message = `You joined the room ${this.settings.current_client.location}`;
    this.settings.bUI.addChatMessage(data, 'server-message-self');
  }

  handleClientUpdate(data) {
    if (this.settings.clients_ids[data.client_id]) {
      const client = this.settings.clients_ids[data.client_id];

      client.rotation = data.rotation;
      client.x = data.x;
      client.y = data.y;
    }
  }

  addClient(data = null, client_sprite, is_self) {
    if (data) {
      data.sprite = client_sprite;
      data.rotation = 0;
      data.x = 0;
      data.y = 0;

      const clients_size = this.settings.clients.push(data);
      this.settings.clients_ids[data.client_id] = this.settings.clients[clients_size-1];

      console.log(data.client_id, this.settings.clients_ids[data.client_id]);

      if (is_self) {
        this.settings.current_client = data;
        console.log(`You have joined with id: ${data.client_id}`);
      }
    }
  }

  //Rooms
  createRoom(data) {
    this.settings.socket.emit('create-room', data);
  }

  joinRoom(data) {
    this.settings.socket.emit('join-room', data);
  }

  leaveRoom() {
    this.settings.socket.emit('leave-room');
  }

  handleCreateRoomDone(data) {
    this.settings.bPubSub.publish("create-room-done", data);
    console.log(data);
  }

  handleJoinRoomDone(data) {
    this.settings.bPubSub.publish("join-room-done", data);
  }

  //Game
  startGame() {
    this.settings.socket.emit('start-game');
  }
}
