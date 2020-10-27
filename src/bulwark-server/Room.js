const nanoid = require('nanoid');
const Enemy = require('./Enemy');
const bServer = require('./Server');
const io = require('./Socket').io;

class Room
{
  constructor(data)
  {
    this.id = nanoid(5);
    this.name = data.name;
    this.status = data.status || 'lobby';
    this.owner = data.owner;
    this.clients = data.clients;
    this.boundTick = this.nextTick.bind(this);
    this.newWaveDelay = 30;

    this.waves = {
      1: {
        enemiesCount: 5,
        maxEnemiesPerTick: 1,
        minTickDistance: 10,
        maxTickDistance: 20,
        velocityMultiplier: 1
      },
      2: {
        enemiesCount: 20,
        maxEnemiesPerTick: 1,
        minTickDistance: 10,
        maxTickDistance: 20,
        velocityMultiplier: 1.2
      },
      3: {
        enemiesCount: 20,
        maxEnemiesPerTick: 1,
        minTickDistance: 10,
        maxTickDistance: 20,
        velocityMultiplier: 1.4
      },
      4: {
        enemiesCount: 20,
        maxEnemiesPerTick: 1,
        minTickDistance: 5,
        maxTickDistance: 20,
        velocityMultiplier: 5
      }
    };

    this.resetRoom();
  }

  resetRoom()
  {
    this.ticks = 0;
    this.ticker = null;
    this.wave = 0;
    this.currentWave = null;
    this.lastTickEnemySpawn = 0;
  }

  destroy()
  {
    this.stopTicks();
  }

  setStatus(status)
  {
    console.log(`>>> Room (${this.id}) status: "${this.status}" -> "${status}"`);
    this.status = status;

    if (this.status === 'in-game') {
      this.resetRoom();
      this.startTicks();
      io.sockets.in(this.id).emit('start-game');
    }

    if (this.status === 'lobby') {
      this.stopTicks();
      io.sockets.in(this.id).emit('stop-game');
    }
  }

  stopTicks()
  {
    this.ticker && clearTimeout(this.ticker);
  }

  startTicks()
  {
    this.ticker = setTimeout(this.boundTick, 1000);
  }

  nextTick()
  {
    if (this.status !== 'in-game') {
      return;
    }

    if (this.wave === 0) {
      // Broadcast to all players the match is starting
      this.nextWave();
    }

    if (this.wave > 0
        && this.currentWave.startTick < this.ticks) {
      // While in a wave, do all the logic
      this.spawner();
    }

    console.log(this.wave, this.currentWave.startTick, this.ticks);

    const waveData = this.waves[this.wave];

    if (this.currentWave.enemiesKilled == waveData.enemiesCount) {
      // Go to next wave when all enemies are dead
      this.nextWave();
    }

    // Update all enemies
    this.currentWave.enemies.forEach(enemy => {
      enemy.update();
      if (enemy.life < 1 && !enemy.killed) {
        this.currentWave.enemiesKilled++;
        enemy.killed = true;
      }
    });

    io.sockets.in(this.id).emit('room-snapshot', this.currentWave);

    //
    // console.log(`Room (${this.id}) ticks: "${this.ticks}"`);
    this.ticker && clearTimeout(this.ticker);
    this.ticker = setTimeout(this.boundTick, bServer.settings.timeDeltaTick);
    this.ticks++;
  }

  spawner()
  {
    // All spawning logic
    const waveData = this.waves[this.wave];

    console.log(this.waves);

    if (this.currentWave.enemiesSpawned >= waveData.enemiesCount) {
      // If the current amount of enemies exceeds the amount of enemies
      // in this wave, just return
      return;
    }

    const tickDeltaLastSpawn = this.ticks - this.lastTickEnemySpawn;

    if (tickDeltaLastSpawn > waveData.minTickDistance) {
      const spawnChance = Math.round(Math.random()) || tickDeltaLastSpawn >= waveData.maxEnemiesPerTick;

      console.log(spawnChance);

      if (spawnChance) {
        this.spawnEnemy();
        this.lastTickEnemySpawn = this.ticks;
        this.currentWave.enemiesSpawned++;
      }
    }
  }

  spawnEnemy()
  {
    console.log('Enemy spawned!');
    const enemy = new Enemy({
      velocityMultiplier: this.currentWave.velocityMultiplier
    });
    this.currentWave.enemies.push(enemy);
    io.sockets.in(this.id).emit('enemy-spawn', enemy);
  }

  nextWave()
  {
    if (!this.waves[this.wave + 1]) {
      // No more waves left
      this.setStatus('lobby');

      return;
    }

    this.wave++;
    this.lastTickEnemySpawn = this.ticks + this.newWaveDelay;
    this.currentWave = {
      startTick: this.ticks + this.newWaveDelay,
      enemies: [],
      enemiesSpawned: 0,
      enemiesKilled: 0,
      velocityMultiplier: this.waves[this.wave].velocityMultiplier
    };

    io.sockets.in(this.id).emit('wave-update', {
      wave: this.wave,
      waveData: this.waves[this.wave]
    });
  }

  checkCollision(data)
  {
    if (!this.currentWave) {
      return;
    }

    const checkDelay = Math.round(data.distance * .05) * (1000 / bServer.settings.clientFps);
    setTimeout(() => {
      this.currentWave.enemies.forEach(enemy => {
        if (enemy.life > 0) {
          if (data.x > enemy.position.x - enemy.widthHalf && data.x < enemy.position.x + enemy.widthHalf
              && data.y > enemy.position.y + enemy.velocity.y - enemy.heightHalf && data.y < enemy.position.y + enemy.velocity.y + enemy.heightHalf) {
            enemy.life -= 100;
            enemy.killed = true;
            this.currentWave.enemiesKilled++;

            const newData = {
              enemy,
              hit: data
            };

            io.sockets.in(this.id).emit('enemy-update', newData);
          }
        }
      });
    }, checkDelay);
  }
}

module.exports = Room;
