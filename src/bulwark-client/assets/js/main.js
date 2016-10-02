// Import all necessary classes

import BulwarkRender from './class/BulwarkRender';
import BulwarkGame from './class/BulwarkGame';
import BulwarkInput from './class/BulwarkInput';
import BulwarkClient from './class/BulwarkClient';

const bRender = new BulwarkRender();
const bGame = new BulwarkGame();
const bInput = new BulwarkInput();
const bClient = new BulwarkClient();

const canvas_holder = document.getElementsByClassName('canvas-holder')[0];

bClient.init();
bGame.init(canvas_holder);
bRender.init(canvas_holder);
bInput.init(canvas_holder, bClient);

const render = bRender.render.bind(bRender);
render();
bClient.listen(bGame, bRender);
