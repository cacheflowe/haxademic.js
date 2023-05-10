import DemoBase from "./demo--base.es6.js";
import URLUtil from "../src/url-util.es6.js";
import * as PIXI from "../vendor/pixi/pixi.mjs";
import PixiStage from "../src/pixi-stage.es6.js";
import PixiSpriteScale from "../src/pixi-sprite-scale.es6.js";
import PixiVideoPlayer from "../src/pixi-video-player.es6.js";
import { WebRtcClient, WebRtcKiosk } from "../src/webrtc-peer.mjs";

class WebRtcVideoStreamToPixi extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "WebRTC | Video stream to PIXI",
      "webrtc-video-stream-pixi-container",
      "Scan the QR code, and you should see a peer-to-peer video call inside of a PIXI canvas, with shader applied"
    );
  }

  init() {
    URLUtil.reloadOnHashChange(); // helps w/pasting the offer link from kiosk tab
    this.addNotyf();
    let offer = URLUtil.getHashQueryVariable("offer");
    if (offer) {
      this.buildClient(offer);
    } else {
      this.buildKiosk();
      this.buildPixiStage();
      this.buildVideoPlayer();
    }
  }

  buildKiosk() {
    this.kiosk = new WebRtcKiosk();
    this.kiosk.addListener("clientStreamStarted", ({ stream }) => {
      this.videoPlayer.updateStream(stream);
      _notyfSuccess("clientStreamStarted");
    });
    this.kiosk.addListener("qrCode", (qrEl) => {
      this.el.appendChild(qrEl);
      _notyfSuccess("QR code generated");
    });
    this.kiosk.addListener("clientCalled", ({ conn, call, callPeerId }) => {
      this.kiosk.replyToCall(call);
      _notyfSuccess("clientCalled");
    });
    this.kiosk.addListener("peerClose", (data) => {
      // stop video feed?
      _notyfSuccess("Call ended");
    });
  }

  buildClient(offer) {
    // client loads webcam and calls kiosk when the initial connection is made,
    // though with a little delay - calling immediately causes an error
    // also, defer connecting to the kiosk until the webcam is initialized
    this.client = new WebRtcClient(offer);
    this.client.addListener("webcamInitialized", (stream) => {
      this.client.displayVideoStream(this.el);
      this.client.callKiosk();
      _notyfSuccess("webcamInitialized");
    });
    this.client.addListener("peerConnected", (data) => {
      this.client.loadWebcam();
    });
    this.client.addListener("serverError", (data) => {
      this.debugEl.innerHTML = "Bad offer from kiosk";
      _notyfError("Couldn't connect: Bad offer");
    });
  }

  // PIXI.js components & animation ------------------------------

  buildPixiStage() {
    this.el.setAttribute("style", "height: 600px;");
    this.pixiStage = new PixiStage(this.el, 0xffff0000);
  }

  buildVideoPlayer() {
    // build video player
    let videoPath = "../data/videos/test-pattern.mp4";
    this.videoPlayer = new PixiVideoPlayer(videoPath, 60, true, true);
    this.pixiStage.container().addChild(this.videoPlayer.sprite());

    // attach backing video element to DOM for debug view
    let videoEl = this.videoPlayer.videoEl();
    videoEl.style.setProperty("width", "320px"); // for debug view
    videoEl.style.setProperty("border", "1px solid #090");
    // document.body.appendChild(videoEl);

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

if (window.autoInitDemo)
  window.demo = new WebRtcVideoStreamToPixi(document.body);
