const bServer = {
  clients: {},
  rooms: {},
  settings: {
    width: 480,
    height: 360,
    tickRate: 10, // ticks per second,
    clientFps: 60
  }
};

bServer.settings.timeDeltaTick = Math.round(1000 / bServer.settings.tickRate);
bServer.settings.clientServerTimeDeltaMultiplier = bServer.settings.timeDeltaTick / (1000 / bServer.settings.clientFps);

module.exports = bServer;
