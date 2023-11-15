import DemoBase from "./demo--base.js";

class CanvasDrawingDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "Canvas | Advanced Compositing",
      "canvas-advanced-compositing-container",
      " "
    );
  }

  // TODO:
  // - Add x, y, w, h to reticle frame
  //   - Share this info across drawing functions
  // - Mask grid with rounded corners
  // - Add max size of reticle so we don't extend beyond grid
  // - Center the grid in the masekd area for reticle background

  init() {
    // config
    this.canvasW = 800;
    this.canvasH = 800;
    this.radarW = 400;
    this.radarH = 400;
    this.reticleW = 400;
    this.reticleH = 400;
    this.reticleMaxW = 400;
    this.reticleMaxH = 400;
    this.reticleR = 50;
    this.gridStep = 40;

    // build canvas elements
    this.buildMainCanvas();
    this.buildCanvasRadarGrid();
    this.buildCanvasRadarGradientMatte();
    this.buildCanvasRadarMaskedGrid();

    // draw any one-time assets
    this.drawGrid();

    // animate
    this.frameCount = 0;
    this.animate();
  }

  //////////////////////////////////
  // Build canvases
  //////////////////////////////////

  createCanvas(w, h) {
    let newCanvas = document.createElement("canvas");
    newCanvas.width = w;
    newCanvas.height = h;
    return newCanvas;
  }

  buildMainCanvas() {
    this.canvas = this.createCanvas(this.canvasW, this.canvasH);
    this.ctx = this.canvas.getContext("2d");
    this.el.appendChild(this.canvas);
    this.el.appendChild(document.createElement("hr"));
  }

  buildCanvasRadarGrid() {
    this.canvasGrid = this.createCanvas(this.radarW, this.radarH);
    this.ctxGrid = this.canvasGrid.getContext("2d");
    this.el.appendChild(this.canvasGrid);
  }

  buildCanvasRadarGradientMatte() {
    this.canvasGradientMatte = this.createCanvas(this.radarW, this.radarH);
    this.ctxGradientMatte = this.canvasGradientMatte.getContext("2d");
    this.el.appendChild(this.canvasGradientMatte);
  }

  buildCanvasRadarMaskedGrid() {
    this.canvasMaskedGrid = this.createCanvas(this.radarW, this.radarH);
    this.ctxMaskedGrid = this.canvasMaskedGrid.getContext("2d");
    this.el.appendChild(this.canvasMaskedGrid);
  }

  //////////////////////////////////
  // Animation
  //////////////////////////////////

  animate() {
    // frame loop
    this.frameCount++;
    requestAnimationFrame(() => this.animate());
    // off-screen compositing
    this.drawGradientMask();
    this.applyGridMask();
    // main drawing
    this.drawBackground();
    this.ctx.save();
    this.setReticlePosition();
    this.drawRadarGrid();
    this.drawDashedOutline();
    this.ctx.restore();
  }

  drawBackground() {
    // static color
    this.ctx.globalCompositeOperation = "source-over"; // default blend mode
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

  setReticlePosition() {
    // TODO: move this around for animation testing
    // TODO: Also simulate reticle size here
    this.ctx.translate(200, 200);
  }

  drawDashedOutline() {
    this.ctx.globalCompositeOperation = "source-over"; // default blend mode
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 3;
    this.ctx.lineDashOffset = this.frameCount;
    this.ctx.setLineDash([this.reticleW / 55]);
    this.ctx.beginPath();
    this.ctx.roundRect(0, 0, this.reticleW, this.reticleH, this.reticleR);
    this.ctx.stroke();
  }

  drawRadarGrid() {
    // draw masked radar grid
    this.ctx.drawImage(this.canvasMaskedGrid, 0, 0, this.radarW, this.radarH);
    // draw thick line at bottom
    let y = this.maskBot;
    let lineW = this.radarW;
    // deal with rounded corners
    if (y > this.radarH - this.reticleR) {
      let y2 = y - (this.radarH - this.reticleR);
      let x = Math.sqrt(Math.pow(this.reticleR, 2) - Math.pow(y2, 2));
      lineW = this.radarW - x;
    }
    // draw line
    if (y < this.radarH) {
      this.ctx.strokeStyle = "#ffffff";
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(lineW, y);
      this.ctx.setLineDash([]);
      this.ctx.stroke();
    }
  }

  drawGradientMask() {
    let w = this.canvasGradientMatte.width;
    let h = this.canvasGradientMatte.height;
    let maskH = this.radarH / 2;
    let yOffset = this.frameCount * 5; // TODO: needs to use deltaTime
    let y = -maskH + (yOffset % (this.radarH + maskH));
    let y2 = maskH;
    this.maskBot = y + y2;
    this.ctxGradientMatte.clearRect(0, 0, w, h);
    // rebuild moving gradient
    let gradient = this.ctxGradientMatte.createLinearGradient(0, y, 0, y + y2);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 1.0)");
    // draw gradient
    this.ctxGradientMatte.globalCompositeOperation = "source-over";
    this.ctxGradientMatte.fillStyle = gradient;
    this.ctxGradientMatte.fillRect(0, y, w, 200);
  }

  applyGridMask() {
    let w = this.canvasGrid.width;
    let h = this.canvasGrid.height;
    this.ctxMaskedGrid.clearRect(0, 0, w, h);
    // draw mask
    this.ctxMaskedGrid.globalCompositeOperation = "source-over";
    this.ctxMaskedGrid.drawImage(this.canvasGradientMatte, 0, 0);
    // then draw grid, which is masked by the gradient image
    this.ctxMaskedGrid.globalCompositeOperation = "source-in";
    this.ctxMaskedGrid.drawImage(this.canvasGrid, 0, 0);
  }

  drawGrid() {
    let w = this.canvasGrid.width;
    let h = this.canvasGrid.height;
    this.ctxGrid.strokeStyle = "rgb(255, 255, 255)";

    // draw rounded mask
    this.ctxGrid.globalCompositeOperation = "source-over";
    this.ctxGrid.fillStyle = "#fff";
    this.ctxGrid.roundRect(0, 0, w, h, this.reticleR);
    this.ctxGrid.fill();

    // semi-transparent background
    this.ctxGrid.globalCompositeOperation = "source-in";
    this.ctxGrid.fillStyle = "rgba(0, 0, 255, 0.3)";
    this.ctxGrid.fillRect(0, 0, w, h);

    // vertical lines
    this.ctxGrid.globalCompositeOperation = "source-over";
    this.ctxGrid.beginPath();
    for (var x = this.gridStep; x < w; x += this.gridStep) {
      this.ctxGrid.moveTo(x, 0);
      this.ctxGrid.lineTo(x, h);
    }
    this.ctxGrid.lineWidth = 2;
    this.ctxGrid.stroke();

    // for the sake of the example 2nd path
    this.ctxGrid.beginPath();
    for (var y = this.gridStep; y < h; y += this.gridStep) {
      this.ctxGrid.moveTo(0, y);
      this.ctxGrid.lineTo(w, y);
    }
    this.ctxGrid.lineWidth = 2;
    this.ctxGrid.stroke();
  }

  drawMaskedLines() {
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
