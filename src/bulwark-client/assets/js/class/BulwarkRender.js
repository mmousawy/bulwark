export default class BulwarkRender {

  constructor() {
    this.SETTINGS = {};

    return {
      SETTINGS: this.SETTINGS,
      init: this.init.bind(this),
      render: this.render.bind(this)
    }
  }

  init(canvas_holder) {
    this.SETTINGS.holder = canvas_holder;

    //Create the renderer
    this.SETTINGS.renderer = PIXI.autoDetectRenderer(480, 270);

    //Add the canvas to the HTML document
    this.SETTINGS.holder.appendChild(this.SETTINGS.renderer.view);

    //Create a container object called the 'stage'
    this.SETTINGS.stage = new PIXI.Container();
    this.SETTINGS.graphics = new PIXI.Graphics();

    this.SETTINGS.stage.addChild(this.SETTINGS.graphics);
  }

  render() {
    window.requestAnimationFrame(this.render.bind(this));

    this.SETTINGS.renderer.render(this.SETTINGS.stage);
  }
}
