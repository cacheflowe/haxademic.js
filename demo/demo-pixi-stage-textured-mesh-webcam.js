import * as PIXI from "../vendor/pixi/pixi.mjs";
import DemoBase from "./demo--base.js";
import MathUtil from "../src/math-util.js";
import PixiStage from "../src/pixi-stage.js";
import Webcam from "../src/webcam.js";

class PixiStageTexturedMeshDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      null,
      "PixiStage | TilingSprite",
      "pixi-stage-textured-mesh-container",
      "A custom TilingSprite array with animated vertices and UV coords"
    );
  }

  init() {
    // set canvas size by aspect ratio
    let bounds = this.el.getBoundingClientRect();
    let height = Math.round(bounds.width * (9 / 16));
    this.el.setAttribute("style", `height: ${height}px;`);
    this.pixiStage = new PixiStage(this.el, 0xff000000);

    // build texture to display
    // this.buildTexture();
    this.buildShader();
    // this.loadImage();
    this.buildWebcamButton();
  }

  buildShader() {
    // add a shader. can we load from a text file?
    var shaderFragTint = `
      precision highp float;

      varying vec2 vTextureCoord;
      uniform sampler2D uSampler;
      uniform float iTime;
      uniform float amp;

      void main() {
        vec4 origColor = texture2D(uSampler, vTextureCoord);
        gl_FragColor = origColor.rgba * vec4(0.5, 0.5, 1.0, 1.0);
      }
    `;
    this.tint = new PIXI.Filter(null, shaderFragTint, {
      iTime: 0,
      amp: 1,
    });
  }

  buildWebcamButton() {
    // add button to start everything
    this.startButton = document.createElement("button");
    this.startButton.innerText = "Start";
    this.el.appendChild(this.startButton);

    // click video to load webcam
    this.startButton.addEventListener("click", (e) => {
      this.startButton.parentNode.removeChild(this.startButton);
      this.initWebcam();
    });
  }

  initWebcam() {
    this.webcam = new Webcam(
      (videoEl) => {
        // start demo when webcam texture is ready
        this.texture = PIXI.Texture.from(videoEl);
        this.texture.once("update", (texture) => {
          this.buildMesh(this.texture);
          this.animate();
        });

        // attach webcam video element to DOM and flip to mirror the video
        this.debugEl.appendChild(videoEl);
        videoEl.style.setProperty("max-width", "100%");
        videoEl.style.setProperty("padding", "2rem");
        videoEl.style.setProperty("background", "#000");
        // Webcam.flipH(videoEl);
        this.animate();

        // allow image saving on click
        this.el.addEventListener("click", (e) => {
          this.pixiStage.saveImage();
        });
      },
      (error) => {
        this.el.innerHTML = "[Webcam ERROR] :: " + error;
      }
    );
  }

  buildTexture() {
    this.texture = PixiStage.newTestPatternTexture(
      this.pixiStage.renderer(),
      this.pixiStage.width(),
      this.pixiStage.height()
    );
    this.buildMesh(this.texture);
    this.animate();
  }

  loadImage() {
    // load image & init after
    this.texture = PIXI.Texture.from("../data/images/bb.jpg");
    this.texture.once("update", (texture) => {
      // use `once` instead of `on`, since event can fire twice. this is noted in the PIXI docs
      this.buildMesh(texture);
      this.animate();
    });
  }

  buildMesh(texture) {
    // BUILD A GRID OF MESHES HERE, WITH A HELPER TO SET UV COORDS AND SIZE/POSITION OF MESHES
    // get canvas dimensions
    let w = this.pixiStage.width();
    let h = this.pixiStage.height();

    // match image scale to PIXI canvas scale for tiling
    this.baseTileScale = w / texture.baseTexture.width;

    this.sprites = [];

    // build grid
    let mult = 2;
    this.cols = 16 * mult;
    this.rows = 9 * mult;
    let cellW = w / this.cols;
    let cellH = h / this.rows;
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        let curX = x * cellW;
        let curY = y * cellH;
        let sprite = new PIXI.TilingSprite(texture, cellW, cellH);
        sprite.anchor.set(0, 0);
        sprite.position.set(curX, curY);
        sprite.tilePosition.set(w - curX, h - curY); // TODO - why is this seemingly reversed???
        sprite.tilePositionOrig = {
          x: sprite.tilePosition.x,
          y: sprite.tilePosition.y,
        };
        sprite.gridX = x;
        sprite.gridY = y;
        sprite.tileScale.set(this.baseTileScale, this.baseTileScale);
        this.sprites.push(sprite);
        this.pixiStage.container().addChild(sprite);

        // randomly add filter
        if (Math.random() > 0.7) {
          // TODO: add tint filter here
          sprite.filters = [this.tint];
        }
      }
    }

    // build grid
    let cols = 8;
    let rows = 4;
    cellW = w / cols;
    cellH = h / rows;
    let scaleAdj = 2;
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        let curX = x * cellW;
        let curY = y * cellH;
        let sprite = new PIXI.TilingSprite(texture, cellW, cellH);
        sprite.anchor.set(0, 0);
        sprite.position.set(curX, curY);
        sprite.tilePosition.set((w - curX) * scaleAdj, (h - curY) * scaleAdj); // TODO - why is this seemingly reversed???
        sprite.tilePositionOrig = {
          x: sprite.tilePosition.x,
          y: sprite.tilePosition.y,
        };
        sprite.gridX = x;
        sprite.gridY = y;
        sprite.tileScale.set(
          this.baseTileScale * scaleAdj,
          this.baseTileScale * scaleAdj
        );
        if (Math.random() > 0.7) {
          this.sprites.push(sprite);
          this.pixiStage.container().addChild(sprite);
        }
        if (Math.random() > 0.7) {
          // TODO: add tint filter here
          sprite.filters = [this.tint];
        }
      }
    }

    // texture repating - might not need this!
    // texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
  }

  animate() {
    // start PIXI frame loop
    this.frameCount = 0;
    this.pixiStage.addFrameListener(() => this.draw());
  }

  gridXFromIndex(index, detail) {
    return index % detail;
  }

  gridYFromIndex(index, detail) {
    return Math.floor(index / detail);
  }

  draw() {
    this.frameCount++;
    if (this.sprites)
      this.sprites.forEach((sprite) => {
        // different UV coord oscillations for funsies
        let xOsc, yOsc;
        let distFromCenter =
          MathUtil.getDistance(
            sprite.gridX,
            sprite.gridY,
            this.cols / 2,
            this.rows / 2
          ) * 3;

        if (this.frameCount % 900 < 300) {
          let radsToCenter = MathUtil.getRadiansToTarget(
            sprite.gridX,
            sprite.gridY,
            this.cols / 2,
            this.rows / 2
          );
          let radialAmp =
            1 * Math.sin(this.frameCount * 0.03 + distFromCenter / 6);
          xOsc = 20 * radialAmp * Math.cos(-radsToCenter);
          yOsc = 20 * radialAmp * Math.sin(-radsToCenter);
        } else if (this.frameCount % 900 < 600) {
          xOsc = 40 * Math.cos(distFromCenter + this.frameCount * 0.03);
          yOsc = 40 * Math.sin(distFromCenter + this.frameCount * 0.03);
        } else {
          xOsc = 40 * Math.cos(sprite.gridX / 3 + this.frameCount * 0.03);
          yOsc = 40 * Math.sin(sprite.gridY / 3 + this.frameCount * 0.03);
        }

        // move UV coords
        sprite.tilePosition.set(
          sprite.tilePositionOrig.x - xOsc,
          sprite.tilePositionOrig.y - yOsc
        );
        // adjust cell size
        // sprite.width = xOsc * 2;
      });
  }
}

if (window.autoInitDemo)
  window.demo = new PixiStageTexturedMeshDemo(document.body);
