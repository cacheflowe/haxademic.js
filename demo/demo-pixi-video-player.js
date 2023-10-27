import DemoBase from "./demo--base.js";
import * as PIXI from "../vendor/pixi/pixi.mjs";
import PixiStage from "../src/pixi-stage.js";
import PixiSpriteScale from "../src/pixi-sprite-scale.js";
import PixiVideoPlayer from "../src/pixi-video-player.js";

class PixiVideoPlayerDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      null,
      "PixiVideoPlayer",
      "pixi-video-player-container",
      "A video player wrapper for PIXI"
    );
  }

  init() {
    this.el.setAttribute("style", "height: 600px;");
    this.pixiStage = new PixiStage(this.el, 0xffff0000);
    this.buildVideoPlayer();
  }

  buildVideoPlayer() {
    // build video player
    let videoPath = "../data/videos/wash-your-hands-512.mp4";
    this.videoPlayer = new PixiVideoPlayer(videoPath, 60, true, true);
    this.pixiStage.container().addChild(this.videoPlayer.sprite());

    // attach backing video element to DOM for debug view
    let videoEl = this.videoPlayer.videoEl();
    videoEl.style.setProperty("width", "320px"); // for debug view
    videoEl.style.setProperty("border", "1px solid #090");
    document.body.appendChild(videoEl);

    // continue
    this.addShader();
    this.animate();
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
    this.videoPlayer.sprite().filters = [this.tint];
  }

  animate() {
    // start PIXI frame loop
    this.frameCount = 0;
    this.pixiStage.addFrameListener(() => this.draw());
  }

  draw() {
    this.frameCount++;
    let videoSprite = this.videoPlayer.sprite();
    if (videoSprite) {
      // update shader
      this.tint.uniforms.iTime = this.frameCount * 0.01;
      this.tint.uniforms.amp = 0.5 + 0.25 * Math.sin(this.frameCount * 0.02);

      // crop to fit video
      PixiSpriteScale.setSizeTextureCropped(
        videoSprite,
        this.pixiStage.width(),
        this.pixiStage.height()
      );
    }
  }
}

if (window.autoInitDemo) window.demo = new PixiVideoPlayerDemo(document.body);
