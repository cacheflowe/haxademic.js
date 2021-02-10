import DemoBase from './demo--base.es6.js';
import PixiStage from '../src/pixi-stage.es6.js';
import PixiSpriteScale from '../src/pixi-sprite-scale.es6.js';
import Webcam from '../src/webcam.es6.js';

class PixiStageWebcamDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [
      '!../vendor/pixi/pixi.min.js'
    ], 'PixiStage | Webcam', 'pixi-stage-webcam-mesh-container');
  }

  init() {
    this.container = document.querySelector('.container');
    // create PIXI stage object
    this.el.setAttribute('style', 'height: 300px;');
    this.pixiStage = new PixiStage(this.el, 0xffff0000);

    // build webcam button first
    this.buildWebcamButton();
    this.buildTexture();
  }

  buildTexture() {
    const graphics = new PIXI.Graphics();

    // bg
    graphics.beginFill(0x000000);
    graphics.drawRect(0, 0, this.pixiStage.width(), this.pixiStage.height());
    graphics.endFill();
    // checkers
    let rectSize = 20;
    var boxCount = 0;
    for (var x = 0; x < this.pixiStage.width(); x+=rectSize) {
      for (var y = 0; y < this.pixiStage.height(); y+=rectSize) {
        if(boxCount % 2 == 0) {
          graphics.beginFill(0xffffff);
          graphics.drawRect(x, y, rectSize, rectSize);
          graphics.endFill();
        }
        boxCount++;
      }
    }

    this.texture = this.pixiStage.graphicsToTexture(graphics);
    this.buildMesh(this.texture);
    this.animate();
  }

  loadImage() {
    // load image & init after
    this.texture = new PIXI.Texture.from('../images/checkerboard-16-9.png');
    this.texture.once('update', (texture) => {    // use `once` instead of `on`, since event can fire twice. this is noted in the PIXI docs
      console.log(texture);
      this.mesh.texture = texture;
      texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;    // texture repating
    });
  }


  buildWebcamButton() {
    // add button to start everything
    this.startButton = document.createElement('button');
    this.startButton.innerText = 'Start';
    this.container.appendChild(this.startButton);

    // click video to load webcam
    this.startButton.addEventListener('click', (e) => {
      this.startButton.parentNode.removeChild(this.startButton);
      // init webcam
      this.webcam = new Webcam((videoEl) => {
        // build PIXI scene
        this.texture = new PIXI.Texture.from(videoEl);
        this.texture.once('update', (texture) => {    // use `once` instead of `on`, since event can fire twice. this is noted in the PIXI docs
          this.sprite = new PIXI.Sprite(texture);
          this.pixiStage.container().addChild(this.sprite);
          this.addShader();
        });

        // attach webcam video element to DOM and flip to mirror the video
        this.debugEl.appendChild(videoEl);
        videoEl.style.setProperty('width', '240px');
        videoEl.style.setProperty('padding', '2rem');
        videoEl.style.setProperty('background', '#000');
        Webcam.flipH(videoEl);
      }, (error) => {
        this.container.innerHTML = '[Webcam ERROR] :: ' + error;
      });
    });
  }

  addShader() {
    var shaderFragTint = `
      precision mediump float;

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
      amp:1
    });
    this.sprite.filters = [this.tint];
  }

  buildMesh(texture) {
    // build mesh. requires at least 2 rows/cols
    this.mesh = new PIXI.SimplePlane(texture, 160, 2);
    this.mesh.pivot.set(this.mesh.width * 0.5, this.mesh.height * 0.5);
    this.mesh.position.set(this.pixiStage.width() * 0.5, this.pixiStage.height() * 0.5);
    this.pixiStage.container().addChild(this.mesh);
  }

  animate() {
    // start PIXI frame loop
    this.frameCount = 0;
    this.pixiStage.addFrameListener(() => this.draw());
  }

  draw() {
    this.frameCount++;
    if(this.sprite) {
      // update shader
      this.tint.uniforms.iTime = this.frameCount * 0.01;
      this.tint.uniforms.amp = 0.5 + 0.25 * Math.sin(this.frameCount * 0.02);

      // PixiSpriteScale.scaleToHeight(this.sprite, this.pixiStage.height());
      PixiSpriteScale.scaleToFillContainer(this.sprite, this.pixiStage.width(), this.pixiStage.height());
      this.sprite.scale.x *= -1; // mirror webcam
      this.sprite.pivot.set(this.sprite.texture.width * 0.5, this.sprite.texture.height * 0.5);
      this.sprite.position.set(this.pixiStage.width() * 0.5, this.pixiStage.height() * 0.5);
    }
  }

}

if(window.autoInitDemo) window.demo = new PixiStageWebcamDemo(document.body);
