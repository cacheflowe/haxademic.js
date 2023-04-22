import * as PIXI from "../vendor/pixi/pixi.mjs";
import DemoBase from "./demo--base.es6.js";
import PixiStage from "../src/pixi-stage.es6.js";
import PixiSpriteScale from "../src/pixi-sprite-scale.es6.js";
import Webcam from "../src/webcam.es6.js";

class PixiStageWebcamSquareDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      null,
      "PixiStage | Webcam Square",
      "pixi-stage-webcam-square",
      "Click to start the camera, then click to download an image."
    );
  }

  init() {
    this.el.setAttribute("style", "width: 512px;");
    this.buildWebcamButton();
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
        // create PIXI stage object at a static size,
        // inside a smaller container
        this.pixiStage = new PixiStage(this.el, 0xffff0000, "pixi", 1, {
          width: 1024,
          height: 1024,
        });
        this.pixiStage.canvas().style.setProperty("width", "100%");
        this.pixiStage.canvas().style.setProperty("height", "auto");

        // build PIXI scene w/video sprite/texture
        this.texture = PIXI.Texture.from(videoEl);
        this.texture.once("update", (texture) => {
          // use `once` instead of `on`, since event can fire twice. this is noted in the PIXI docs
          this.sprite = new PIXI.Sprite(texture);
          this.pixiStage.container().addChild(this.sprite);
          this.addShader();
        });

        // attach webcam video element to DOM and flip to mirror the video
        this.debugEl.appendChild(videoEl);
        videoEl.style.setProperty("max-width", "100%");
        videoEl.style.setProperty("padding", "2rem");
        videoEl.style.setProperty("background", "#000");
        Webcam.flipH(videoEl);
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

  addShader() {
    var shaderFragTint = `
      precision highp float;

      varying vec2 vTextureCoord;
      uniform sampler2D uSampler;
      uniform float iTime;

      float luma(vec3 color) {
        return dot(color, vec3(0.299, 0.587, 0.114));
      }

      void main() {
        vec4 origColor = texture2D(uSampler, vTextureCoord);
        float grayContrasted = smoothstep(0.1, 0.9, luma(origColor.xyz));
        gl_FragColor = vec4(grayContrasted, grayContrasted, grayContrasted, 1.);
      }
    `;
    this.tint = new PIXI.Filter(null, shaderFragTint, {
      iTime: 0,
    });
    this.sprite.filters = [this.tint];
  }

  animate() {
    // start PIXI frame loop
    this.frameCount = 0;
    this.pixiStage.addFrameListener(() => this.draw());
  }

  draw() {
    this.frameCount++;
    if (this.sprite) {
      // update shader
      this.tint.uniforms.iTime = this.frameCount * 0.01;

      // PixiSpriteScale.scaleToHeight(this.sprite, this.pixiStage.height());
      PixiSpriteScale.scaleToFillContainer(
        this.sprite,
        this.pixiStage.width(),
        this.pixiStage.height()
      );
      this.sprite.scale.x *= -1; // mirror webcam
      this.sprite.pivot.set(
        this.sprite.texture.width * 0.5,
        this.sprite.texture.height * 0.5
      );
      this.sprite.position.set(
        this.pixiStage.width() * 0.5,
        this.pixiStage.height() * 0.5
      );
    }
  }
}

if (window.autoInitDemo)
  window.demo = new PixiStageWebcamSquareDemo(document.body);
