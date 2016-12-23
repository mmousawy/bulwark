// Import all necessary classes
const bRender = new BulwarkRender();
const bGame   = new BulwarkGame();
const bInput  = new BulwarkInput();
const bClient = new BulwarkClient();
const bUI     = new BulwarkUI();
const bPubSub = new BulwarkPubSub();

const canvas_holder = document.getElementsByClassName('canvas-holder')[0];

bGame.init(canvas_holder, bRender, bGame, bInput, bClient, bUI, bPubSub);
