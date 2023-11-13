import DemoBase from "./demo--base.js";

class CanvasDrawingDemo extends DemoBase {
  constructor(parentEl) {
    super(parentEl, [], "Canvas | Drawing", "canvas-tests-container", " ");
  }

  // TODO:
  // - Add canvas factory method
  // - Add x, y, w, h to reticle frame
  //   - Share this info across drawing functions
  // - Mask grid with rounded corners
  // - Add max size of reticle so we don't extend beyond grid
  // - Center the grid in the masekd area for reticle background

  init() {
    this.loadImage();
    this.buildCanvas();
    this.buildReticle();

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
    this.canvasW = 800;
    this.canvasH = 800;
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.canvasW;
    this.canvas.height = this.canvasH;
    this.ctx = this.canvas.getContext("2d");
    this.el.appendChild(this.canvas);
  }

  buildReticle() {
    this.reticleW = 400;
    this.reticleH = 400;
    // build canvas elements
    this.buildCanvasGrid();
    this.buildCanvasGradientMatte();
    this.buildCanvasMaskedGrid();
    // draw any one-time assets
    this.drawGrid();
  }

  buildCanvasGrid() {
    this.canvasGrid = document.createElement("canvas");
    this.canvasGrid.width = this.reticleW;
    this.canvasGrid.height = this.reticleH;
    this.ctxGrid = this.canvasGrid.getContext("2d");
    this.el.appendChild(this.canvasGrid);
  }

  buildCanvasGradientMatte() {
    this.canvasGradientMatte = document.createElement("canvas");
    this.canvasGradientMatte.width = this.reticleW;
    this.canvasGradientMatte.height = this.reticleH;
    this.ctxGradientMatte = this.canvasGradientMatte.getContext("2d");
    this.el.appendChild(this.canvasGradientMatte);
  }

  buildCanvasMaskedGrid() {
    this.canvasMaskedGrid = document.createElement("canvas");
    this.canvasMaskedGrid.width = this.reticleW;
    this.canvasMaskedGrid.height = this.reticleH;
    this.ctxMaskedGrid = this.canvasMaskedGrid.getContext("2d");
    this.el.appendChild(this.canvasMaskedGrid);
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
    this.ctx.fillRect(0, 0, this.canvasW, this.canvasH);

    // radial gradient
    let x = this.canvasW / 2;
    let y = this.canvasH / 2;
    let r = this.canvasW;
    var gradient = this.ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0.0, "rgba(80, 80, 80, 1)");
    gradient.addColorStop(1.0, "rgba(0, 0, 0, 1)");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvasW, this.canvasH);
  }

  drawDashedOutline() {
    this.ctx.globalCompositeOperation = "source-over"; // default blend mode
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 3;
    this.ctx.lineDashOffset = this.frameCount;
    this.ctx.setLineDash([23 / 3, 23 / 3]); // why this magic number to make dashes loop properly?
    this.ctx.beginPath();
    this.ctx.roundRect(200, 200, this.canvasW - 400, this.canvasH - 400, 20);
    this.ctx.stroke();
  }

  drawRadarGrid() {
    // draw masked radar grid
    this.ctx.drawImage(this.canvasMaskedGrid, 200, 200, 400, 400);
    // draw thick line at bottom
    let y = 200 + this.maskBot;
    if (y < this.reticleH + 200) {
      this.ctx.strokeStyle = "#ffffff";
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(200, y);
      this.ctx.lineTo(600, y);
      this.ctx.setLineDash([]);
      this.ctx.stroke();
    }
  }

  drawGradientMask() {
    let w = this.canvasGradientMatte.width;
    let h = this.canvasGradientMatte.height;
    let maskH = 200;
    let y = -maskH + ((this.frameCount * 5) % (400 + maskH)); // TODO: needs to use delta time
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

    // transparent background
    this.ctxGrid.fillStyle = "rgba(0, 0, 255, 0.3)";
    this.ctxGrid.fillRect(0, 0, w, h);

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
