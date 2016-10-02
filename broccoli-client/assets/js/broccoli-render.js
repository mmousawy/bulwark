//Create the renderer
const renderer = PIXI.autoDetectRenderer(256, 256);

//Add the canvas to the HTML document
document.body.appendChild(renderer.view);

//Create a container object called the `stage`
let stage = new PIXI.Container();

let graphics = new PIXI.Graphics();

//Tell the `renderer` to `render` the `stage`
renderer.render(stage);
stage.addChild(graphics);

// Rendering methods
renderClick = function(data) {
  graphics.beginFill(0x00ff00);
  graphics.drawCircle(data.x, data.y, 10);
  graphics.endFill();
  console.log('Draw sprite');
}

function gameLoop() {
  //Loop this function 60 times per second
  requestAnimationFrame(gameLoop);

  renderer.render(stage);
}

gameLoop();
