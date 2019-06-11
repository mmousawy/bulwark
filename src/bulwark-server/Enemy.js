const nanoid = require('nanoid');
const bServer = require('./Server');

class Enemy
{
  constructor(data)
  {
    this.id = nanoid(5);
    this.life = 100;
    this.width = 48;
    this.height = 48;
    this.widthHalf = this.width * .5;
    this.heightHalf = this.height * .5;
    this.killed = false;

    this.position = {
      x: 40 + Math.round(Math.random() * (bServer.settings.width - 40)),
      y: -20
    };
    // this.position = {
    //   x: bServer.settings.width * .9,
    //   y: 100
    // };

    this.velocity = {
      x: (Math.random() - Math.random()) * data.velocityMultiplier,
      y: (1 + Math.random()) * data.velocityMultiplier,
      angular: (Math.random() - Math.random()) * Math.PI * .01
    };

    return this;
  }

  update()
  {
    if (this.life > 0) {
      this.position.x += this.velocity.x * bServer.settings.clientServerTimeDeltaMultiplier;
      this.position.y += this.velocity.y * bServer.settings.clientServerTimeDeltaMultiplier;
    }

    if (this.position.y > 330) {
      this.life -= 100;
    }
  }
}

module.exports = Enemy;
