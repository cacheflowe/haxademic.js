import DemoBase from "./demo--base.js";

class ScrollSnapIntersectionObserverDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "Scroll Snap | Intersection Observer",
      "scroll-snap-container",
      "Scroll-snap css w/an IntersectionObserver to adjust slides on swipe"
    );
  }

  init() {
    this.injectCSS(`
      .scroll-snap-container {
        overflow: auto;
        display: flex;
        scroll-snap-type: x mandatory;
      }
      
      .slide {
        height: 200px;
        width: 200px;
        background: red;
        margin-right: 5px;
        flex-shrink: 0;
        scroll-snap-align: start;
        transition: all 1s ease-in-out;
      }

      .slide.active {
        background: green;
      }
      
      .dots {
        display: flex;
        justify-content: center;
      }
      
      .dot {
        all: unset;
        margin-right: 5px;
        height: 10px;
        width: 10px;
        border-radius: 10px;
        background: gray;
        margin-top: 10px;
        cursor: pointer;
      }
      
      .dot:focus {
        outline: 1px solid blue;
      }
    `);

    this.injectHTML(`
      <div>
        <div class="scroll-snap-container">
          <div class="slide"></div>
          <div class="slide"></div>
          <div class="slide"></div>
          <div class="slide"></div>
          <div class="slide"></div>
          <div class="slide"></div>  
          <div class="slide"></div>
          <div class="slide"></div>
          <div class="slide"></div>
          <div class="slide"></div>  
        </div>
        <div class="dots">
          <button class="dot"></button>
          <button class="dot"></button>
          <button class="dot"></button>
          <button class="dot"></button>
          <button class="dot"></button>
          <button class="dot"></button>
          <button class="dot"></button>
          <button class="dot"></button>
          <button class="dot"></button>
        </div>
      </div>
    `);

    this.addPaginationDots();
    this.addIntersectionOberserver();
  }

  addPaginationDots() {
    // add pagination click listener
    const dots = document.querySelector(".dots");
    dots.addEventListener("click", (e) => {
      const target = e.target;
      if (!target.matches(".dot")) return;

      const index = Array.from(dots.children).indexOf(target);
      const selector = `.slide:nth-child(${index + 1})`;
      const slide = document.querySelector(selector);
      slide.scrollIntoView({
        behavior: "smooth",
        inline: "start",
      });
    });
  }

  handleIntersection(entries) {
    // console.log(entries);
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
      } else {
        entry.target.classList.remove("active");
      }
    });
  }

  addIntersectionOberserver() {
    this.removeIntersectionObserver();

    // https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
    // https://blog.webdevsimplified.com/2022-01/intersection-observer/
    // get references to elements
    this.slideshowEl = document.querySelector(".scroll-snap-container");
    this.slides = this.slideshowEl.querySelectorAll(".slide");
    this.slides = Array.from(this.slides); // convert slides to an array

    // build observer
    let options = {
      root: this.slideshowEl,
      rootMargin: "200px",
      threshold: 1.0,
    };
    this.observer = new IntersectionObserver((entries) => {
      this.handleIntersection(entries);
    }, options);

    // add slides to observer
    this.slides.forEach((slide) => {
      this.observer.observe(slide);
    });
  }

  removeIntersectionObserver() {
    if (this.observer) {
      this.slides.forEach((slide) => {
        this.observer.unobserve(slide);
      });
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

if (window.autoInitDemo)
  window.demo = new ScrollSnapIntersectionObserverDemo(document.body);
