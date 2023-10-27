import * as PIXI from "../vendor/pixi/pixi.mjs";
import DemoBase from "./demo--base.js";
import PixiStage from "../src/pixi-stage.js";
import PixiSpriteScale from "../src/pixi-sprite-scale.js";

class PixiStageDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "PixiStage | Shader",
      "pixi-stage-container",
      "A fullscreen shader with PIXI.js",
      true
    );
  }

  init() {
    // create PIXI stage object
    this.pixiStage = new PixiStage(
      this.el /*,
      0xff000000,
      "pixi",
      window.devicePixelRatio */
    );
    this.buildBg();
    this.buildShaders();

    // start PIXI frame loop
    this.frameCount = 0;
    this.pixiStage.addFrameListener(() => this.draw());
  }

  buildBg() {
    this.bg = new PIXI.Graphics();
    this.bg.beginFill(0x333333, 1);
    this.bg.drawRect(0, 0, this.pixiStage.width(), this.pixiStage.height());
    this.bg.pivot.set(this.bg.width * 0.5, this.bg.height * 0.5);
    this.pixiStage.container().addChild(this.bg);
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
        gl_FragColor = origColor;
      }
    `;
    this.tint = new PIXI.Filter(null, shaderFragTint, {
      iTime: 0,
      amp: 1,
    });

    this.patternShader = `
      precision highp float;

      varying vec2 vTextureCoord;
      uniform sampler2D uSampler;
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
    // fullscreen surface
    this.bg.width = this.pixiStage.width();
    this.bg.height = this.pixiStage.height();
    this.bg.position.set(
      this.pixiStage.width() * 0.5,
      this.pixiStage.height() * 0.5
    );

    // update shaders
    this.pattern.uniforms.iTime = this.frameCount * 0.01;
    this.pattern.uniforms.dimensions[0] = this.pixiStage.width(); // if running on entire this.pixiStage.container(), we need to use heightRenderer()
    this.pattern.uniforms.dimensions[1] = this.pixiStage.height();
  }
}

if (window.autoInitDemo) window.demo = new PixiStageDemo(document.body);
