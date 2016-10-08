// Import all necessary classes

/*import BulwarkRender from './class/BulwarkRender';
import BulwarkGame from './class/BulwarkGame';
import BulwarkInput from './class/BulwarkInput';
import BulwarkClient from './class/BulwarkClient';*/

const bRender = new BulwarkRender();
const bGame = new BulwarkGame();
const bInput = new BulwarkInput();
const bClient = new BulwarkClient();

const canvas_holder = document.getElementsByClassName('canvas-holder')[0];

bClient.init();
bGame.init(canvas_holder, bRender, bGame, bInput, bClient);
bRender.init([480, 270], canvas_holder);
bInput.init(canvas_holder, bClient);

const loop = bGame.gameLoop.bind(bGame);
loop(bRender, bGame, bInput, bClient);

const listen = bClient.listen.bind(bClient);
listen(bRender, bGame, bInput, bClient);
