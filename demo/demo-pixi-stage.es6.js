import * as PIXI from "../vendor/pixi/pixi.mjs";
import DemoBase from "./demo--base.es6.js";
import PixiStage from "../src/pixi-stage.es6.js";
import PixiSpriteScale from "../src/pixi-sprite-scale.es6.js";

class PixiStageDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "PixiStage",
      "pixi-stage-container",
      "A basic PIXI.js app wrapper",
      true
    );
  }

  init() {
    // create PIXI stage object
    this.pixiContainer = document.getElementById("pixi-stage-container");
    // this.pixiContainer.setAttribute('style', 'height: 500px;');
    this.pixiStage = new PixiStage(this.pixiContainer); // , 0xff000000, 'pixi', 2);

    // load image before building other objects
    this.loadImage();
  }

  async loadImage() {
    // let this.sprite = PIXI.Sprite.from('images/cacheflowe-logo-trans-white.png');
    PIXI.Assets.add("cache", "../images/cacheflowe-logo-trans-white.png");
    await PIXI.Assets.load("cache");

    this.buildSprite(PIXI.Assets.get("cache"));
    this.buildShaders();
    // start PIXI frame loop
    this.frameCount = 0;
    this.pixiStage.addFrameListener(() => this.draw());
  }

  loadImageAlt() {
    // load image & init after
    this.texture = PIXI.Texture.from("../images/checkerboard-16-9.png");
    this.texture.once("update", (texture) => {
      // use `once` instead of `on`, since event can fire twice. this is noted in the PIXI docs
      PixiStage.setTextureRepeat(texture, true);
      this.mesh.texture = texture;
    });
  }

  // init this.sprite & extras
  buildSprite(texture) {
    // build this.bg
    this.bg = new PIXI.Graphics();
    this.bg.beginFill(0x333333, 1);
    this.bg.drawRect(0, 0, this.pixiStage.width(), this.pixiStage.height());
    this.bg.pivot.set(this.bg.width * 0.5, this.bg.height * 0.5);
    this.bg.position.set(
      this.pixiStage.width() * 0.5,
      this.pixiStage.height() * 0.5
    );
    this.pixiStage.container().addChild(this.bg);

    // build image this.sprite
    // debugger;
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.anchor.set(0.5);
    this.sprite.position.set(
      this.pixiStage.width() * 0.5,
      this.pixiStage.height() * 0.5
    );
    PixiSpriteScale.scaleToHeight(this.sprite, this.pixiStage.height());
    this.pixiStage.container().addChild(this.sprite);
  }

  buildShaders() {
    // add a shader. can we load from a text file?
    var shaderFragTint = `
      precision highp float;

      varying vec2 vTextureCoord;
      uniform sampler2D uSampler;
      uniform float iTime;
      uniform float amp;

      void main() {
        vec4 origColor = texture2D(uSampler, vTextureCoord);
        vec4 otherColor = vec4(
          0.5 + 0.5 * sin(iTime * 3.1),
          0.5 + 0.5 * sin(iTime * 1.2),
          0.5 + 0.5 * sin(iTime * 6.12),
          1.);
        gl_FragColor = mix(origColor, otherColor, amp * 0.15);
      }
    `;
    this.tint = new PIXI.Filter(null, shaderFragTint, {
      iTime: 0,
      amp: 1,
    });
    // this.pixiStage.container().filters = [this.tint];

    this.patternShader = `
      precision highp float;

      varying vec2 vTextureCoord;
      uniform float iTime;
      uniform vec2 dimensions;

      #define PI     3.14159265358
      #define TWO_PI 6.28318530718

      void main() {
        float time = iTime * 0.2;									                    // adjust time
        vec2 uv = gl_FragCoord.xy / dimensions.xy;
        uv -= 0.5;                                                    // centering
        uv.x *= dimensions.x / dimensions.y;                          // aspect ratio correction

        float rads = atan(uv.x, uv.y);                   			      	// get radians to center
        float dist = length(uv);										                  // store distance to center
        float spinAmp = 4.;												                    // set spin amplitude
        float spinFreq = 2. + sin(time) * 0.5;							          // set spin frequency
        rads += sin(time + dist * spinFreq) * spinAmp;					      // wave based on distance + time
        float radialStripes = 10.;										                // break the circle up
        float col = 0.5 + 0.5 * sin(rads * radialStripes);				    // oscillate color around the circle
        col = smoothstep(0.5,0.6, col);									              // remap color w/smoothstep to remove blurriness
        col -= dist / 2.;												                      // vignette - reduce color w/distance
        gl_FragColor = vec4(vec3(col), 1.);
      }
    `;
    this.pattern = new PIXI.Filter(null, this.patternShader, {
      iTime: 0,
      dimensions: [this.pixiStage.width(), this.pixiStage.height()],
    });
    this.bg.filters = [this.pattern, this.tint];
  }

  draw() {
    this.frameCount++;
    if (this.sprite != null) {
      // update this.bg with window resizes
      this.bg.width = this.pixiStage.width();
      this.bg.height = this.pixiStage.height();
      this.bg.position.set(
        this.pixiStage.width() * 0.5,
        this.pixiStage.height() * 0.5
      );

      // position & oscillate logo
      this.sprite.position.set(
        this.pixiStage.width() * 0.5,
        this.pixiStage.height() * 0.5
      );
      PixiSpriteScale.scaleToHeight(
        this.sprite,
        this.pixiStage.height() * (0.6 + 0.1 * Math.sin(this.frameCount * 0.01))
      );

      // update shaders
      this.tint.uniforms.iTime = this.frameCount * 0.01;
      this.tint.uniforms.amp = 0.75 + 0.25 * Math.sin(this.frameCount * 0.02);
      this.pattern.uniforms.iTime = this.frameCount * 0.01;
      this.pattern.uniforms.dimensions[0] = this.pixiStage.width(); // if running on entire this.pixiStage.container(), we need to use heightRenderer()
      this.pattern.uniforms.dimensions[1] = this.pixiStage.height();
    }
  }

  initWebcam() {
    // add button to start everything
    this.startButton = document.createElement("button");
    this.startButton.innerText = "Start";
    this.pixiContainer.appendChild(this.startButton);

    // click video to add audio response
    this.startButton.addEventListener("click", (e) => {
      this.startButton.parentNode.removeChild(this.startButton);

      // init this.pixiStage
      this.this.pixiStage = new PixiStage(
        (videoEl) => {
          // attach to DOM and flip to mirror the video
          this.pixiContainer.appendChild(videoEl);
          PixiStage.flipH(videoEl);
        },
        (error) => {
          this.pixiContainer.innerHTML = "[PixiStage ERROR] :: " + error;
        }
      );
    });
  }
}

if (window.autoInitDemo) window.demo = new PixiStageDemo(document.body);
