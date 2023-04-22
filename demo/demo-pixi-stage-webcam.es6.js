import * as PIXI from "../vendor/pixi/pixi.mjs";
import DemoBase from "./demo--base.es6.js";
import PixiStage from "../src/pixi-stage.es6.js";
import PixiSpriteScale from "../src/pixi-sprite-scale.es6.js";
import Webcam from "../src/webcam.es6.js";

class PixiStageWebcamDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      null,
      "PixiStage | Webcam",
      "pixi-stage-webcam-mesh-container",
      "Video texture in PIXI, cropped to fill, with a bonus shader"
    );
  }

  init() {
    this.el.setAttribute("style", "height: 300px;");
    this.pixiStage = new PixiStage(this.el, 0xffff0000);

    // build webcam button first
    this.buildWebcamButton();
    this.buildTexture();
  }

  buildTexture() {
    this.texture = PixiStage.newTestPatternTexture(
      this.pixiStage.renderer(),
      this.pixiStage.width() - 40,
      this.pixiStage.height() - 40
    );
    this.buildMesh(this.texture);
    this.animate();
  }

  buildWebcamButton() {
    // add button to start everything
    this.startButton = document.createElement("button");
    this.startButton.innerText = "Start";
    this.el.appendChild(this.startButton);

    // click video to load webcam
    this.startButton.addEventListener("click", (e) => {
      this.startButton.parentNode.removeChild(this.startButton);
      // init webcam
      this.webcam = new Webcam(
        (videoEl) => {
          // build PIXI scene
          this.texture = PIXI.Texture.from(videoEl);
          this.texture.once("update", (texture) => {
            // use `once` instead of `on`, since event can fire twice. this is noted in the PIXI docs
            this.sprite = new PIXI.Sprite(texture);
            this.pixiStage.container().addChild(this.sprite);
            this.addShader();
          });

          // attach webcam video element to DOM and flip to mirror the video
          this.debugEl.appendChild(videoEl);
          videoEl.style.setProperty("width", "240px");
          videoEl.style.setProperty("padding", "2rem");
          videoEl.style.setProperty("background", "#000");
          Webcam.flipH(videoEl);
        },
        (error) => {
          this.el.innerHTML = "[Webcam ERROR] :: " + error;
        }
      );
    });
  }

  addShader() {
    var shaderFragTint = `
      precision highp float;

      varying vec2 vTextureCoord;
      uniform sampler2D uSampler;
      uniform float iTime;
      uniform float amp;

      float luma(vec3 color) {
        return dot(color, vec3(0.299, 0.587, 0.114));
      }

      void main() {
        vec4 origColor = texture2D(uSampler, vTextureCoord);
        vec4 otherColor = vec4(
          0.5 + 0.5 * sin(iTime * 11.),
          0.5 + 0.5 * sin(iTime * 14.),
          0.5 + 0.5 * sin(iTime * 15.),
          1.);

        float origLuma = smoothstep(0.4, 0.6, luma(origColor.xyz));   // replace dark colors with a flipped/thresholded luma
        gl_FragColor = mix(origColor, otherColor, amp * (1. - origLuma));
      }
    `;
    this.tint = new PIXI.Filter(null, shaderFragTint, {
      iTime: 0,
      amp: 1,
    });
    this.sprite.filters = [this.tint];
  }

  buildMesh(texture) {
    // build mesh. requires at least 2 rows/cols
    this.mesh = new PIXI.SimplePlane(texture, 160, 2);
    this.mesh.pivot.set(this.mesh.width * 0.5, this.mesh.height * 0.5);
    this.mesh.position.set(
      this.pixiStage.width() * 0.5,
      this.pixiStage.height() * 0.5
    );
    this.pixiStage.container().addChild(this.mesh);
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
      this.tint.uniforms.amp = 0.5 + 0.25 * Math.sin(this.frameCount * 0.02);

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

if (window.autoInitDemo) window.demo = new PixiStageWebcamDemo(document.body);
