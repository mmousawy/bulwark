export default class BulwarkClient {

  constructor() {
    this.SETTINGS = {};

    return {
      SETTINGS: this.SETTINGS,
      init: this.init.bind(this),
      listen: this.listen.bind(this)
    }
  }

  init() {
    // Connect to server
    this.SETTINGS.socket = io('http://127.0.0.1:3000/');
  }

  listen(bGame, bRender) {
    // Listen to the following...
    this.SETTINGS.socket.on('connect', function(){});
    this.SETTINGS.socket.on('player-click', function(data) {
      bGame.addCircle(data, bRender);
    });
    this.SETTINGS.socket.on('player-join', function(data) {
      bGame.addPlayer(data, bRender);
    });
    this.SETTINGS.socket.on('event', function(data){});
    this.SETTINGS.socket.on('disconnect', function(){});
  }
}
