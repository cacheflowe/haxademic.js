import DemoBase from './demo--base.es6.js';
import CanvasFilters from '../src/canvas-filters.es6.js';
import DOMUtil from '../src/dom-util.es6.js';
import ImageUtil from '../src/image-util.es6.js';
import Webcam from '../src/webcam.es6.js';

class WebcamToCanvasDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [], 'Webcam To Canvas', 'webcam-to-canvas-container');
  }

  init() {
    // add button to start everything
    this.startButton = document.createElement('button');
    this.startButton.innerText = 'Start';
    this.el.appendChild(this.startButton);

    // add canvas to crop webcam stream
    this.canvasEl = document.createElement('canvas');
    this.canvasEl.setAttribute('width', 1024);
    this.canvasEl.setAttribute('height', 1024);
    this.canvasEl.setAttribute('style', 'width: 100%');
    this.canvasEl.setAttribute('style', 'max-width: 320px');
    this.ctx = this.canvasEl.getContext('2d');

    // click video to load webcam
    this.startButton.addEventListener('click', (e) => {
      this.startButton.parentNode.removeChild(this.startButton);
      this.initWebcam();
    });
  }

  initWebcam() {
    // init webcam
    this.webcam = new Webcam((videoEl) => {
      // attach to DOM and flip to mirror the video
      this.el.appendChild(DOMUtil.stringToDomElement('<h4>Cropped canvas</h4>'));
      this.el.appendChild(this.canvasEl);  
      this.el.appendChild(DOMUtil.stringToDomElement('<h4>Video source</h4>'));
      this.el.appendChild(videoEl);
      Webcam.flipH(videoEl);
      this.videoEl = videoEl;
      this.animate();
    }, (error) => {
      this.el.innerHTML = '[Webcam ERROR] :: ' + error;
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // calculate cropping offset & size (only once)
    if(!this.cropData && this.videoEl.videoWidth > 0) {
      this.cropData = ImageUtil.getOffsetAndSizeToCrop(this.canvasEl.width, this.canvasEl.height, this.videoEl.videoWidth, this.videoEl.videoHeight, true);
      console.log(this.cropData);
      console.log(this.videoEl.videoWidth, this.videoEl.videoHeight);
    }

    // crop copy video to canvas
    if(this.cropData) {
      this.drawWebcamToCanvas();
      this.applyCanvasFilters();
    }
  }

  drawWebcamToCanvas() {
    let x = this.cropData[0];
    let y = this.cropData[1];
    let w = this.cropData[2];
    let h = this.cropData[3];
    this.ctx.save();                              // push
    this.ctx.translate(this.canvasEl.width, 0);   // flip x
    this.ctx.scale(-1, 1);
    this.ctx.drawImage(this.videoEl, x, y, w, h); // crop to fill
    this.ctx.restore();                           // pop
  }

  applyCanvasFilters() {
    // just for funsies. could be optimized 
    // by only getting pixel data once, 
    // and sharing across filters. But should really
    // just be done w/shaders in WebGL
    CanvasFilters.desaturate(this.canvasEl);
    CanvasFilters.contrastImage(this.canvasEl, 100);
  }
}

if(window.autoInitDemo) window.demo = new WebcamToCanvasDemo(document.body);
