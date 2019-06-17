/////////////////////////////////////////////
// DOM tests
/////////////////////////////////////////////

// header
mainEl.appendChild(DOMUtil.stringToDomElement("<h1>PixiStage</h1>"));

// create log output element
insertHtmlStr(`<div id="pixi-stage" style="height: 400px;"></div>`);
let pixiEl = document.getElementById('pixi-stage');

// create PIXI stage object
let pixiStage = new PixiStage(pixiEl);

// let sprite = PIXI.Sprite.from('images/cacheflowe-logo-trans-white.png');
// global vars
var sprite = null;
var bg = null;
var tint = null;
var pattern = null;

// use PIXI.Loader
const loader = PIXI.Loader.shared; // PixiJS exposes a premade instance for you to use.
loader.add('cache', 'images/cacheflowe-logo-trans-white.png');
loader.load((loader, resources) => {
  buildSprite(resources);
});

// throughout the process multiple signals can be dispatched.
loader.onProgress.add(() => {}); // called once per loaded/errored file
loader.onError.add(() => {}); // called once per errored file
loader.onLoad.add(() => {}); // called once per loaded file
loader.onComplete.add(() => {}); // called once when the queued resources all load.

// init sprite & extras
function buildSprite(resources) {
  // build bg
  bg = new PIXI.Graphics();
  bg.beginFill(0x333333, 1);
  bg.drawRect(0, 0, pixiStage.width(), pixiStage.height());
  pixiStage.container().addChild(bg);

  // build sprite
  sprite = new PIXI.Sprite(resources['cache'].texture);
  sprite.anchor.set(0.5);
  sprite.position.set(pixiStage.width() * 0.5, pixiStage.height() * 0.5);
  PixiSpriteScale.scaleToHeight(sprite, pixiStage.height());
  pixiStage.container().addChild(sprite);

  // add a shader. can we load from a text file?
  var shaderFragTint = `
    precision mediump float;

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
  tint = new PIXI.Filter(null, shaderFragTint, {iTime: 0, amp:1});
  // pixiStage.container().filters = [tint];

  var patternShader = `
    precision mediump float;

    varying vec2 vTextureCoord;
    uniform float iTime;
    uniform vec2 dimensions;

    #define PI     3.14159265358
    #define TWO_PI 6.28318530718

    void main() {
      float time = iTime * 1.;									                    // adjust time
      //vec2 uv = vTextureCoord - 0.5;
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
  pattern = new PIXI.Filter(null, patternShader, {iTime: 0, dimensions: [pixiStage.width(), pixiStage.height()]});
  bg.filters = [pattern, tint];
}

// oscillate scale on PIXI frame loop
var frameCount = 0;
pixiStage.addFrameListener(function() {
  frameCount++;
  if(sprite != null) {
    // update bg with window resizes
    bg.width = pixiStage.width();
    bg.height = pixiStage.height();

    // position & oscillate logo
    sprite.position.set(pixiStage.width() * 0.5, pixiStage.height() * 0.5);
    PixiSpriteScale.scaleToHeight(sprite, pixiStage.height() * (0.8 + 0.1 * Math.sin(frameCount * 0.01)));

    // update shaders
    tint.uniforms.iTime = frameCount * 0.01;
    tint.uniforms.amp = 0.75 + 0.25 * Math.sin(frameCount * 0.02);
    pattern.uniforms.iTime = frameCount * 0.01;
    pattern.uniforms.dimensions[0] = pixiStage.width();   // if running on entire pixiStage.container(), we need to use heightRenderer()
    pattern.uniforms.dimensions[1] = pixiStage.height();
  }
});


// break
insertHtmlStr('<hr/>');

/////////////////////////////////////////////
// Unit tests
/////////////////////////////////////////////
