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

  init() {
    // config
    this.canvasW = 800;
    this.canvasH = 800;
    this.radarW = 400;
    this.radarH = 400;
    this.reticleW = this.radarW;
    this.reticleH = this.radarH;
    this.reticleMaxW = this.radarW;
    this.reticleMaxH = this.radarH;
    this.reticleRBase = 20;
    this.reticleR = this.reticleRBase;
    this.gridStep = 40;
    this.curScale = 1;

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

    // demo helpers
    super.injectCSS(`canvas{ max-width: 100%; }`);
    super.injectCSS(`.third{ width: 33%; }`);
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
    this.canvasGrid.classList.add("third");
    this.ctxGrid = this.canvasGrid.getContext("2d");
    this.el.appendChild(this.canvasGrid);
  }

  buildCanvasRadarGradientMatte() {
    this.maskTop = 0;
    this.canvasGradientMatte = this.createCanvas(this.radarW, this.radarH);
    this.canvasGradientMatte.classList.add("third");
    this.ctxGradientMatte = this.canvasGradientMatte.getContext("2d");
    this.el.appendChild(this.canvasGradientMatte);
  }

  buildCanvasRadarMaskedGrid() {
    this.canvasMaskedGrid = this.createCanvas(this.radarW, this.radarH);
    this.canvasMaskedGrid.classList.add("third");
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
    let size = 300 + Math.sin(this.frameCount * 0.03) * 100;
    this.curScale = size / this.reticleMaxW;
    this.reticleR = this.reticleRBase * this.curScale;
    this.reticleW = size;
    this.reticleH = size;
    // center + offset
    let x = this.canvasW / 2 - this.reticleW / 2;
    let y = this.canvasH / 2 - this.reticleH / 2;
    this.ctx.translate(x, y);
  }

  drawDashedOutline() {
    this.ctx.globalCompositeOperation = "source-over"; // default blend mode
    this.ctx.strokeStyle = "#ffffff";
    this.ctx.lineWidth = 3;
    // this.ctx.lineDashOffset = this.frameCount;
    this.ctx.setLineDash([11 * this.curScale]);
    this.ctx.beginPath();
    this.ctx.roundRect(0, 0, this.reticleW, this.reticleH, this.reticleR);
    this.ctx.stroke();
  }

  easeInCubic(x) {
    return 1 - Math.sqrt(1 - Math.pow(x, 2));
  }

  easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
  }

  drawRadarGrid() {
    // draw masked radar grid
    let w = this.reticleW;
    let h = this.reticleH;
    this.ctx.drawImage(this.canvasMaskedGrid, 0, 0, w, h);

    // draw thick line at bottom
    let x = 0;
    let y = this.maskBot * this.curScale; // scale from reticle size change
    let lineW = this.reticleW;

    // draw line
    if (y < this.reticleH) {
      // deal with rounded corners - shrink the line
      if (y > this.reticleH - this.reticleR) {
        let progress = (y - (this.reticleH - this.reticleR)) / this.reticleR;
        let curveSubtract = this.easeInCubic(progress) * this.reticleR;
        lineW -= curveSubtract;
        x += curveSubtract;
      } else if (y < this.reticleR) {
        let progress = 1 - y / this.reticleR;
        let curveSubtract = this.easeInCubic(progress) * this.reticleR;
        lineW -= curveSubtract;
        x += curveSubtract;
      }
      // finally draw the line
      this.ctx.strokeStyle = "#ffffff";
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(lineW, y);
      this.ctx.setLineDash([]);
      this.ctx.stroke();
    }
  }

  drawGradientMask() {
    let w = this.canvasGradientMatte.width;
    let h = this.canvasGradientMatte.height;
    this.ctxGradientMatte.clearRect(0, 0, w, h);

    let maskH = this.radarH / 2;
    this.maskTop += 5;
    this.maskBot = this.maskTop + maskH;
    if (this.maskTop > this.reticleH + maskH) this.maskTop = -maskH;
    let y = this.maskTop;
    let y2 = this.maskBot;
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
