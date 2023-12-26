import DemoBase from "./demo--base.js";
import URLUtil from "../src/url-util.js";

class WebComponentDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "WebComponent",
      "web-component-container",
      "Testing out the WebComponent concept with container queries, ResizeObserver, custom Events and more."
    );
  }

  init() {
    this.injectCSS(`
      #web-component-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr auto;
        gap: 1rem;
        margin: 2rem 0 3rem;
      }
      custom-element {
        grid-row: 1;
      }
    `);
    this.el.innerHTML = `
      <custom-element color="#000066"></custom-element>
      <custom-element color="#006600" debug></custom-element>
    `;
    this.testUpdateComponent();
  }

  testUpdateComponent() {
    this.component = document.querySelector("custom-element");
    this.component.setAttribute("resolution", 200);
    this.component.setAttribute("debug", true);
    this.component.update();

    // query a child in the web component - relies on {mode: "open"}
    let div = this.component.shadowRoot.querySelector("div");
    console.log("Shadow div:", div);

    // listen for custom events
    this.component.addEventListener("colorUpdated", (e) => {
      console.log("Color updated:", e.detail.color);
    });
  }
}

class CustomWebComponent extends HTMLElement {
  constructor() {
    super();
    this.renderCount = 0;
    this.el = this.attachShadow({ mode: "open" }); // "open" allows querying and probably lots more
    this.update();
  }

  update() {
    // get props
    this.defColor = String(this.getAttribute("color")) || "#ff0000";
    const resolution = Number(this.getAttribute("resolution")) || 100;
    const debug = this.hasAttribute("debug");
    const size = { w: resolution, h: resolution };

    // render!
    this.render();
    this.initComponent();
  }

  initComponent() {
    // remove listeners
    this.resizeObserver?.disconnect();
    this.colorPicker?.removeEventListener("input", this.colorPicked);

    // add listeners
    if (!this.colorPicked)
      this.colorPicked = this.colorPickedListener.bind(this);
    this.colorPicker = this.el.querySelector("input.color");
    this.colorPicker.value = this.defColor;
    this.colorPicker.addEventListener("input", this.colorPicked);
    this.colorPicked({ target: this.colorPicker });

    // add resize observer
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        this.resized();
      }
    });
    this.resizeObserver.observe(this.container);
  }

  colorPickedListener(e) {
    const newColor = e.target.value;
    this.article.style.backgroundColor = newColor;
    this.dispatchEvent(
      new CustomEvent("colorUpdated", { detail: { color: newColor } })
    );
  }

  resized() {
    // print bounding box & render info
    const bb = this.container.getBoundingClientRect();
    this.article.innerHTML = `
      Size: ${Math.round(bb.width)} x ${Math.round(bb.height)} <br>
      Rendered ${this.renderCount} times
    `;
  }

  render() {
    this.el.innerHTML = `
      <div class="container">
        <article></article>
        <input class="color" type="color" value="#00ff00" />
      </div>

      <style>
        article {
          width: 100%;
          aspect-ratio: 1 / 1;
          padding: 2rem;
          box-sizing: border-box;
        }

        .color {
          grid-column: 1 / span 2;
          margin-top: 1rem;
        }

        /* Testing container queries */
        /* :host sets the context for the container queries */

        :host {
          display: block;
          container-type: inline-size;
        }

        @container (max-width: 199px) {
          article {
            color:#ff0000;
          }
        }

        @container (min-width: 200px) and (max-width: 399px) {
          article {
            color:#ffff00;
          }
        }

        @container (min-width: 400px) {
          article {
            color:#ffffff;
          }
        }
      </style>
    `;
    this.renderCount++;
    this.container = this.el.querySelector(".container");
    this.article = this.el.querySelector("article");
  }
}

customElements.define("custom-element", CustomWebComponent);

if (window.autoInitDemo) window.demo = new WebComponentDemo(document.body);
