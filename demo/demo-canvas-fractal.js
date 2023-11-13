import DemoBase from "./demo--base.js";

class CanvasFractalDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "Canvas | Fractal",
      "canvas-fractal-container",
      'Press "r" to generate a random hash.<br>Press "s" to save.<br>Add "&hash=FF00AA44....." to the URL to create a link into a deterministic, reproducable shape. Check the console for the current hash.',
      true
    );
  }

  init() {
    let queryHash = Fractal.getQueryParam("hash");
    let hash = queryHash
      ? queryHash
      : "c5b841ef41ea44c6682174f9626072c0d47c095665f6e59ad3264bc91f5d2e66";
    this.fractal = new Fractal(hash);
  }

  keyDown(key) {
    console.log(key);
    if (key == "r") this.fractal.setRandomHash();
    if (key == "s") this.fractal.saveImage();
  }
}

class Fractal {
  constructor(hash) {
    // console.log('randomHash()', this.randomHash());
    this.buildCanvas();
    this.setHash(hash);
    // console.log(this.getHashValAt(0), this.getHashValAt(1), this.getHashValAt(200));
    this.animate();
  }

  buildCanvas() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas = document.createElement("canvas");
    this.canvas.style.setProperty("position", "fixed");
    this.canvas.style.setProperty("left", "0");
    this.canvas.style.setProperty("top", "0");
    this.canvas.style.setProperty("z-index", "-1");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.context = this.canvas.getContext("2d");
    document.body.appendChild(this.canvas);
    window.addEventListener("resize", () => this.resize());
    this.canvas.addEventListener("click", () => this.setRandomHash());
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.needsRedraw = true;
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

  generateShapeProps() {
    this.needsRedraw = true;
    this.maxLevels = 5;
    this.frameCount = 0;
    this.baseRadius = this.height / 4; //  Math.max(this.width, this.height) / 4;
    this.curCircleSegment = 0;
    this.recursiveDivisor = this.remap(
      this.hexToNum(this.getHashValAt(4)),
      0,
      255,
      0.5,
      1
    );
    this.baseRadius -= this.baseRadius * this.recursiveDivisor * 0.2; // shrink base size when divisor is high
    this.rootRot = 0;

    // shape properties (configurable)
    this.polygonVertices = Math.round(
      this.remap(this.hexToNum(this.getHashValAt(6)), 0, 255, 3, 8)
    );
    this.drawsInnerLines = this.booleanFromHex(this.getHashValAt(0));
    this.inwardIsOkay = this.booleanFromHex(this.getHashValAt(25));
    this.rotatesChildren = this.booleanFromHex(this.getHashValAt(26));
    if (this.inwardIsOkay) this.maxLevels--;
    this.backgroundR = this.hexToNum(this.getHashValAt(19));
    this.backgroundG = this.hexToNum(this.getHashValAt(20));
    this.backgroundB = this.hexToNum(this.getHashValAt(21));
    this.backgroundA = 1; // this.remap(this.hexToNum(this.getHashValAt(22)), 0, 255, 0.6, 1);
    this.backgroundColor = `rgba(${this.backgroundR},${this.backgroundG},${this.backgroundB},${this.backgroundA})`;
    this.fillsShape = this.booleanFromHex(this.getHashValAt(1));
    this.fillsSolid = this.booleanFromHex(this.getHashValAt(2));
    this.fillR = this.hexToNum(this.getHashValAt(10));
    this.fillG = this.hexToNum(this.getHashValAt(11));
    this.fillB = this.hexToNum(this.getHashValAt(12));
    this.fillA = this.remap(
      this.hexToNum(this.getHashValAt(13)),
      0,
      255,
      0.4,
      1
    );
    this.fillColor = `rgba(${this.fillR},${this.fillG},${this.fillB},${this.fillA})`;
    this.strokeWidth = this.remap(
      this.hexToNum(this.getHashValAt(5)),
      0,
      255,
      0.5,
      10
    );
    this.strokeR = this.hexToNum(this.getHashValAt(15));
    this.strokeG = this.hexToNum(this.getHashValAt(16));
    this.strokeB = this.hexToNum(this.getHashValAt(17));
    this.strokeA = this.remap(
      this.hexToNum(this.getHashValAt(18)),
      0,
      255,
      0.4,
      1
    );
    if (this.booleanFromHex(this.getHashValAt(26))) this.strokeA = 1;
    this.strokeColor = `rgba(${this.strokeR},${this.strokeG},${this.strokeB},${this.strokeA})`;
    this.shadow = this.remap(
      this.hexToNum(this.getHashValAt(24)),
      0,
      255,
      0,
      20
    );
  }

  //////////////////////////////////
  // hash/data helpers
  //////////////////////////////////

  setHash(hash) {
    this.hash = hash;
    this.generateShapeProps();
    console.log(`Current hash: ${this.hash}`);
  }

  setRandomHash() {
    this.setHash(this.randomHash());
    this.generateShapeProps();
  }

  randomHash() {
    let hash = "";
    for (let i = 0; i < 32; i++) {
      hash += this.numToHex(this.randRange(0, 255));
    }
    return hash;
  }

  static getQueryParam(variable, paramsStartChar = "#") {
    let url = document.location.hash;
    let paramsString = url.split(paramsStartChar)[1];
    let searchParams = new URLSearchParams(paramsString);
    for (let [key, value] of searchParams) {
      if (key == variable) return value;
    }
    return null;
  }

  getHashValAt(position) {
    position *= 2;
    position = position % this.hash.length; // wrap around
    return this.hash.substr(position, 2);
  }

  numToHex(num) {
    return num.toString(16);
  }

  hexToNum(hexStr) {
    return parseInt(hexStr, 16);
  }

  booleanFromHex(hexStr) {
    return this.hexToNum(hexStr) >= 127;
  }

  //////////////////////////////////
  // math helpers
  //////////////////////////////////

  remap(value, low1, high1, low2, high2) {
    return low2 + ((high2 - low2) * (value - low1)) / (high1 - low1);
  }

  randRange(min, max, rounds = true) {
    let randNum = Math.random() * (max - min);
    if (rounds) randNum = Math.round(randNum);
    return randNum + min;
  }

  getDistance(x1, y1, x2, y2) {
    let a = x1 - x2;
    let b = y1 - y2;
    return Math.abs(Math.sqrt(a * a + b * b));
  }

  //////////////////////////////////
  // Animation
  //////////////////////////////////

  animate() {
    if (this.needsRedraw) {
      // removed animation for now
      this.needsRedraw = false;
      this.context.globalCompositeOperation = "source-over"; // default blend mode
      this.drawBackground();
      // this.context.globalCompositeOperation = "color"; // "luminosity"; // normal | multiply | screen | overlay | darken | lighten | color-dodge | color-burn | hard-light | soft-light | difference | exclusion | hue | saturation | color | luminosity
      this.updateBaseShapeProps();
      this.drawPolygonParent(
        0,
        this.width / 2,
        this.height / 2,
        this.rootRot,
        this.startRadius
      );
    }
    requestAnimationFrame(() => this.animate());
  }

  //////////////////////////////////
  // Shape logic
  //////////////////////////////////

  updateBaseShapeProps() {
    this.frameCount += 1;
    this.curCircleSegment = (Math.PI * 2) / this.polygonVertices;
    this.startRadius = this.baseRadius; // + this.baseRadius/9 * Math.sin(this.frameCount * 0.001);
    this.rootRot = this.curCircleSegment / 2;
  }

  drawBackground() {
    // static color
    this.context.fillStyle = this.backgroundColor;
    this.context.fillRect(0, 0, this.width, this.height);

    // radial gradient
    var gradient = this.context.createRadialGradient(
      this.width / 2,
      this.height / 2,
      0,
      this.width / 2,
      this.height / 2,
      this.width
    );
    gradient.addColorStop(0.0, this.backgroundColor);
    gradient.addColorStop(1.0, "rgba(0,0,0,1)");
    this.context.fillStyle = gradient;
    this.context.fillRect(0, 0, this.width, this.height);
  }

  drawPolygonChildAtVertex(level, parentX, parentY, startCircleInc, radius) {
    // children are smaller than parent
    radius *= this.recursiveDivisor;

    // rotate children to keep it interesting
    if (this.rotatesChildren) startCircleInc += this.rootRot;

    // find center point of child
    let x = parentX + Math.sin(startCircleInc) * radius;
    let y = parentY + Math.cos(startCircleInc) * radius;
    var extraX = Math.sin(startCircleInc) * radius * this.recursiveDivisor;
    var extraY = Math.cos(startCircleInc) * radius * this.recursiveDivisor;
    let childCenterX = x + extraX;
    let childCenterY = y + extraY;

    // try to make sure new polys are further than the center of the current... not the best option here
    var polyCenterDistToSceneCenter = this.getDistance(
      parentX,
      parentY,
      this.width / 2,
      this.height / 2
    );
    var polyArmDist = this.getDistance(x, y, this.width / 2, this.height / 2);
    var isOutward = polyCenterDistToSceneCenter < polyArmDist;
    if (isOutward || this.inwardIsOkay) {
      // draw next child
      this.drawPolygonParent(
        level,
        childCenterX,
        childCenterY,
        this.curCircleSegment + startCircleInc,
        radius
      );
    }

    // return coordinates for parent
    return {
      x: x,
      y: y,
      childX: childCenterX,
      childY: childCenterY,
      isOutward: isOutward,
    };
  }

  drawPolygonParent(level, x, y, startCircleInc, radius) {
    // prevent too many recursions
    level++;
    if (level > this.maxLevels) return;

    // stoke temporary array of children
    // to draw after child draws
    var vertices = [];
    for (var i = 0; i < this.polygonVertices; i++) {
      let curRads = this.curCircleSegment * i;
      vertices.push(
        this.drawPolygonChildAtVertex(
          level,
          x,
          y,
          curRads + startCircleInc,
          radius
        )
      );
    }

    // draw the polygon
    // configure polygon draw props
    if (this.fillsShape) this.context.fillStyle = this.fillColor;
    else this.context.fillStyle = "rgba(255,255,255,0)";
    this.context.strokeStyle = this.strokeColor;
    this.context.lineWidth = this.strokeWidth;
    this.context.lineJoin = "round";

    // draw lines between parent & child
    if (this.drawsInnerLines && level < this.maxLevels) {
      for (var i = 0; i < this.polygonVertices; i++) {
        if (vertices[i].isOutward) {
          this.context.beginPath();
          this.context.moveTo(vertices[i].x, vertices[i].y);
          this.context.lineTo(vertices[i].childX, vertices[i].childY);
          this.context.closePath();
          this.context.fill();
          this.context.stroke();
        }
      }
    }

    // draw actual polygon shape
    this.context.beginPath();
    this.context.moveTo(vertices[0].x, vertices[0].y);
    for (var i = 0; i < this.polygonVertices; i++) {
      this.context.lineTo(vertices[i].x, vertices[i].y);
    }
    this.context.closePath();
    this.context.shadowColor = "black";
    this.context.shadowBlur = this.shadow;
    this.context.fill();
    this.context.stroke();
    this.context.shadowBlur = 0;

    // draw lines between polygon center & vertices
    if (this.drawsInnerLines) {
      for (var i = 0; i < this.polygonVertices; i++) {
        this.context.beginPath();
        this.context.moveTo(x, y);
        this.context.lineTo(vertices[i].x, vertices[i].y);
        this.context.closePath();
        this.context.fill();
        this.context.stroke();
      }
    }
  }
}

if (window.autoInitDemo) window.demo = new CanvasFractalDemo(document.body);
