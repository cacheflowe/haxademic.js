import DemoBase from "./demo--base.es6.js";
import URLUtil from "../src/url-util.es6.js";
import * as PIXI from "../vendor/pixi/pixi.mjs";
import PixiStage from "../src/pixi-stage.es6.js";
import PixiSpriteScale from "../src/pixi-sprite-scale.es6.js";
import PixiVideoPlayer from "../src/pixi-video-player.es6.js";

class WebRtcVideoStreamToPixi extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [
        "!https://unpkg.com/peerjs@1.4.7/dist/peerjs.min.js",
        "!https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js",
      ],
      "WebRTC | Video stream to PIXI",
      "webrtc-video-stream-pixi-container",
      "Scan the QR code, and you should see a peer-to-peer video call inside of a PIXI canvas, with shader applied"
    );
  }

  init() {
    this.initWebRtcVideo();
  }

  buildPixiStage() {
    this.el.setAttribute("style", "height: 600px;");
    this.pixiStage = new PixiStage(this.el, 0xffff0000);
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

  initWebRtcVideo() {
    // is there an offer in the URL?
    this.kioskOfferId = URLUtil.getHashQueryVariable("offer");
    if (this.kioskOfferId) {
      this.log("offer:", this.kioskOfferId);
    }

    // create peer object
    this.peer = new Peer({
      id: "cacheflowe-kiosk", // make sure to remove this when not testing
    });
    this.conn = null;
    this.isKiosk = !this.kioskOfferId;
    this.clientConnections = [];

    // connect to peer server, and init connections
    if (this.isKiosk) {
      this.buildPixiStage();
      this.buildVideoPlayer();
      this.initKiosk();
      this.initWebCam();
    } else {
      this.initClient();
      this.initWebCam();
    }
  }

  keyDown(key) {
    this.sendJSON(key);
  }

  log(...args) {
    args.forEach((arg) => {
      console.important(arg);
    });
  }

  //////////////////////////////////////
  // kiosk connection
  //////////////////////////////////////

  initKiosk() {
    this.initKioskPeerConnection();
    this.initKioskConnectionListeners();
    this.initKioskCallListeners();
  }

  initKioskPeerConnection() {
    this.peer.on("open", (peerID) => {
      this.log("Kiosk connected w/peerID", peerID);
      this.advertiseConnection(peerID);
    });
  }

  advertiseConnection(peerID) {
    // build link container
    let qrContainer = document.createElement("p");
    qrContainer.id = "qrcode";
    this.el.appendChild(qrContainer);

    // add link to connect
    let offerLink = document.createElement("a");
    offerLink.href = `${window.location.href}&offer=${peerID}`;
    offerLink.innerText = offerLink.href;
    qrContainer.appendChild(offerLink);

    // add QR code - appends to id of "qrcode"
    let qrCode = new QRCode("qrcode", offerLink.href);
  }

  initKioskConnectionListeners() {
    this.peer.on("connection", (conn) => {
      this.conn = conn;
      this.log("Client connected!", this.conn);

      this.conn.on("open", () => {
        this.log("Kiosk: open connection!");
      });

      this.conn.on("data", (data) => {
        this.log("Kiosk: on data!", data);
        this.receiveData(data);
      });
    });
  }

  initKioskCallListeners() {
    // listen for a video call from client
    this.peer.on("call", (call) => {
      let callPeerId = call.peer;
      console.log("call received from client", call);
      // answer the call with our own video/audio stream
      // call.answer(this.localVideoStream);

      // video stream from client
      call.on("stream", (stream) => {
        // Store a reference of the client user stream
        if (this.clientConnections.indexOf(callPeerId) === -1) {
          console.log("Client stream added", callPeerId);
          this.streamPeer = stream;
          this.overwriteVideoStream(stream, false, "Client Video");
        } else {
          console.log("Client already connected", callPeerId);
        }
        // track stream connection to disallow duplicates
        this.clientConnections.push(callPeerId);
      });

      // Handle when the call finishes
      call.on("close", () => {
        alert("The videocall has finished");
      });

      // use call.close() to finish a call
    });
  }

  //////////////////////////////////////
  // client connection
  //////////////////////////////////////

  initClient() {
    this.peer.on("open", (peerID) => {
      this.clientPeerId = peerID;
      this.conn = this.peer.connect(this.kioskOfferId);
      this.log("Client connecting to:", this.kioskOfferId, this.conn);

      // show offer
      let offerText = document.createElement("p");
      offerText.innerHTML = `Offer: ${this.kioskOfferId}<br>`;
      offerText.innerHTML += `Client peer ID: ${this.clientPeerId}`;
      this.el.appendChild(offerText);

      // add listeners
      this.conn.on("connection", (data) => {
        this.log("client: client connected!", data);
      });

      // receive data from kiosk
      this.conn.on("data", (data) => {
        this.log("client: on data!", data);
        this.receiveData(data);
      });

      // add call button
      let callButton = document.createElement("button");
      callButton.innerText = "Call Kiosk";
      callButton.addEventListener("click", () => {
        this.startCallFromClient();
      });
      this.el.appendChild(callButton);
    });
  }

  initWebCam() {
    this.loadLocalWebcam({
      success: (stream) => {
        this.localVideoStream = stream;
        if (this.isKiosk)
          this.overwriteVideoStream(stream, true, "Local Video");
        if (!this.isKiosk) this.displayVideoStream(stream, true, "Local Video");
        if (!this.isKiosk) this.startCallFromClient();
      },
      error: (err) => {
        alert("Cannot get access to your camera and video !");
        console.error(err);
      },
    });
  }

  startCallFromClient() {
    // send call to kiosk
    var call = this.peer.call(this.kioskOfferId, this.localVideoStream);
    // receive stream back from kiosk after call
    call.on("stream", (stream) => {
      this.log("Replace the previous if we get a new one? This is called 2x");
      console.log(this.streamPeer, stream);
      if (!this.streamPeer) {
        this.streamPeer = stream;
        this.displayVideoStream(stream, false, "Kiosk Video");
      }
    });
  }

  //////////////////////////////////////
  // data transport
  //////////////////////////////////////

  sendJSON(data) {
    if (this.conn) {
      this.conn.send(data);
      this.log("sent data:", data);
    } // else console.error("No connection, can't send data");
  }

  receiveData(data) {
    this.log("Received data:", data);
    if (!!data && data.cmd == "image") {
      let img = document.createElement("img");
      img.style.setProperty("width", "100%");
      img.src = data.base64Img;
      this.el.appendChild(img);
    }
  }

  //////////////////////////////////////
  // video transport
  //////////////////////////////////////

  loadLocalWebcam(callbacks) {
    // Monkeypatch for crossbrowser geusermedia
    navigator.getUserMedia =
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia;

    // Request audio and video
    navigator.getUserMedia(
      { audio: true, video: true },
      callbacks.success,
      callbacks.error
    );
  }

  overwriteVideoStream(stream) {
    console.log("overwriting video stream!", stream);
    this.videoPlayer.updateStream(stream);
  }

  displayVideoStream(stream, isOwnVideo, label) {
    // build label to identify stream
    let labelEl = document.createElement("div");
    labelEl.innerText = label;
    this.el.appendChild(labelEl);

    // Retrieve the video element according to the desired
    let videoEl = document.createElement("video");
    // TODO: mute if video is our own
    if (isOwnVideo) {
      videoEl.defaultMuted = true;
      videoEl.setAttribute("muted", "true");
    }
    videoEl.setAttribute("width", "100%");
    videoEl.setAttribute("playsinline", "playsinline");
    videoEl.setAttribute("autoplay", "autoplay");
    videoEl.srcObject = stream;
    this.el.appendChild(videoEl);
  }
}

if (window.autoInitDemo)
  window.demo = new WebRtcVideoStreamToPixi(document.body);
