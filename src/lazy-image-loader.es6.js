class LazyImageLoader {

  constructor(el) {
    this.el = el;
    this.scrollHandler = null;
    this.imgQueue = null;
    this.imgNodes = this.el.querySelectorAll('[data-src]');
    this.imgs = [];
    for(let i=0; i < this.imgNodes.length; i++) this.imgs.push(this.imgNodes[i]);
    this.loadNextImage();
  }

  loadNextImage() {
    if(this.imgs.length == 0) this.scrollHandler = null;
    if(this.imgs.length == 0) return;
    let curImg = this.imgs.shift();
    // load if on-screen, otherwise queue up and watch for scrolling
    if(DOMUtil.isElementVisible(curImg) == true) {
      this.loadImage(curImg);
    } else {
      this.queueImage(curImg);
    }
  }

  loadImage(curImg) {
    let img = new Image();
    img.onload = () => {
      if(curImg.getAttribute('data-src-bg')) {
        curImg.style.backgroundImage = `url(${img.src})`;
      } else {
        curImg.setAttribute('src', img.src);
      }
      curImg.removeAttribute('data-src');
      this.loadNextImage();
    };
    img.onerror = () => {
      this.loadNextImage();
    };
    img.src = curImg.getAttribute('data-src');
  }

  queueImage(curImg) {
    if(this.scrollHandler == null) {
      this.scrollHandler = this.scrolled.bind(this);
      window.addEventListener('scroll', this.scrollHandler);
    }
    this.imgQueue = curImg;
  }

	scrolled() {
    if(this.scrollHandler != null) {
      if(this.imgQueue != null) {
        if(DOMUtil.isElementVisible(this.imgQueue) == true) {
          this.loadImage(this.imgQueue);
          this.imgQueue = null;
        }
      }
    } else {
      this.dispose();
    }
	}

	dispose() {
    window.removeEventListener('scroll', this.scrollHandler);
	}

}
