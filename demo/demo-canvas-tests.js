import DemoBase from "./demo--base.js";

class CanvasDrawingDemo extends DemoBase {
  constructor(parentEl) {
    super(parentEl, [], "Canvas | Drawing", "canvas-tests-container", "");
  }

  init() {
    this.loadImage();
    this.buildCanvas();
    this.buildCanvasGrid();
    this.buildCanvasGradientMatte();
    this.buildCanvasMaskedGrid();
    this.resize();
    this.initProps();

    this.drawGrid();

    this.frameCount = 0;
    this.animate();
  }

  keyDown(key) {
    if (key == "s") this.drawing.saveImage();
  }

  loadImage() {
    let imagePath = "../data/images/bb.jpg";
    this.imageEl = document.createElement("img");
    this.imageEl.setAttribute("src", imagePath);
  }

  buildCanvas() {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.el.appendChild(this.canvas);
  }

  buildCanvasGrid() {
    this.canvasGrid = document.createElement("canvas");
    this.ctxGrid = this.canvasGrid.getContext("2d");
    this.el.appendChild(this.canvasGrid);
  }

  buildCanvasGradientMatte() {
    this.canvasGradientMatte = document.createElement("canvas");
    this.ctxGradientMatte = this.canvasGradientMatte.getContext("2d");
    this.el.appendChild(this.canvasGradientMatte);
  }

  buildCanvasMaskedGrid() {
    this.canvasMaskedGrid = document.createElement("canvas");
    this.ctxMaskedGrid = this.canvasMaskedGrid.getContext("2d");
    this.el.appendChild(this.canvasMaskedGrid);
  }

  initProps() {
    this.backgroundColor = "#555555";
  }

  resize() {
    this.width = 800;
    this.height = 800;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvasGrid.width = this.width;
    this.canvasGrid.height = this.height;
    this.canvasGradientMatte.width = this.width;
    this.canvasGradientMatte.height = this.height;
    this.canvasMaskedGrid.width = this.width;
    this.canvasMaskedGrid.height = this.height;
  }

  saveImage() {
    if (this.renderedImg) document.body.removeChild(this.renderedImg);
    let imgBase64 = this.canvas.toDataURL();
    this.renderedImg = document.createElement("img");
    this.renderedImg.src = imgBase64;
    this.renderedImg.setAttribute(
      "style",
      "width: 250px; box-shadow: 0 0 5px #000000; position: fixed; bottom: 2rem; left: 50%; margin-left: -125px;"
    );
    document.body.appendChild(this.renderedImg);
  }

  //////////////////////////////////
  // Animation
  //////////////////////////////////

  animate() {
    // this.ctx.globalCompositeOperation = "color"; // "luminosity"; // normal | multiply | screen | overlay | darken | lighten | color-dodge | color-burn | hard-light | soft-light | difference | exclusion | hue | saturation | color | luminosity
    this.frameCount++;
    this.ctx.globalCompositeOperation = "source-over"; // default blend mode
    this.drawGradientMask();
    this.applyGridMask();
    this.drawBackground();
    this.drawRadarGrid();
    this.drawDashedOutline();
    requestAnimationFrame(() => this.animate());
  }

  drawBackground() {
    // static color
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // radial gradient
    var gradient = this.ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      0,
      this.width / 2,
      this.height / 2,
      this.width
    );
    gradient.addColorStop(0.0, this.backgroundColor);
    gradient.addColorStop(1.0, "rgba(0,0,0,1)");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawDashedOutline() {
    this.ctx.globalCompositeOperation = "source-over"; // default blend mode
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 3;
    this.ctx.lineDashOffset = this.frameCount;
    this.ctx.setLineDash([23 / 3, 23 / 3]); // why this magic number to make dashes loop properly?
    this.ctx.beginPath();
    this.ctx.roundRect(200, 200, this.width - 400, this.height - 400, 20);
    this.ctx.stroke();
  }

  drawRadarGrid() {
    // draw masked radar grid
    this.ctx.drawImage(this.canvasMaskedGrid, 200, 200, 400, 400);
    // draw think line at bottom
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 3;
    this.ctx.moveTo(200, this.maskBot);
    this.ctx.lineTo(600, this.maskBot);
    this.ctx.setLineDash([]);
    this.ctx.stroke();
  }

  drawGradientMask() {
    let w = this.canvasGradientMatte.width;
    let h = this.canvasGradientMatte.height;
    let maskH = 200;
    let y = -maskH + ((this.frameCount * 5) % (800 + maskH)); // TODO: needs to use delta time
    let y2 = maskH;
    this.maskBot = y + y2;
    this.ctxGradientMatte.clearRect(0, 0, w, h);
    let gradient = this.ctxGradientMatte.createLinearGradient(0, y, 0, y + y2);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 1.0)");
    this.ctxGradientMatte.fillStyle = gradient;
    this.ctxGradientMatte.fillRect(0, y, w, 200);
  }

  applyGridMask() {
    let img = this.imageEl;
    let w = this.canvasGrid.width;
    let h = this.canvasGrid.height;
    this.ctxMaskedGrid.clearRect(0, 0, w, h);
    this.ctxMaskedGrid.globalCompositeOperation = "source-over";
    this.ctxMaskedGrid.drawImage(this.canvasGradientMatte, 0, 0);
    this.ctxMaskedGrid.globalCompositeOperation = "source-in";
    this.ctxMaskedGrid.drawImage(this.canvasGrid, 0, 0);
  }

  drawGrid() {
    let step = 40;
    let w = this.canvasGrid.width;
    let h = this.canvasGrid.height;
    this.ctxGrid.strokeStyle = "rgb(255, 255, 255)";

    // vertical lines
    this.ctxGrid.beginPath();
    for (var x = 0; x <= w; x += step) {
      this.ctxGrid.moveTo(x, 0);
      this.ctxGrid.lineTo(x, h);
    }
    this.ctxGrid.lineWidth = 2;
    this.ctxGrid.stroke();

    // for the sake of the example 2nd path
    this.ctxGrid.beginPath();
    for (var y = 0; y <= h; y += step) {
      this.ctxGrid.moveTo(0, y);
      this.ctxGrid.lineTo(w, y);
    }
    this.ctxGrid.lineWidth = 2;
    this.ctxGrid.stroke();
  }

  drawMaskedLines() {
    let img = this.imageEl;
    let w = img.width;
    let h = img.height;
    this.ctx.drawImage(img, 0, 0, w, h, 0, 0, w, img.height);
    this.ctx.globalCompositeOperation = "destination-out";
    let gradient = this.ctx.createLinearGradient(0, 0, 0, img.height);
    gradient.addColorStop(0, "rgba(0, 255, 255, 0.01)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 1.0)");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, img.width, img.height);
  }
}

if (window.autoInitDemo) window.demo = new CanvasDrawingDemo(document.body);
