import DemoBase from "./demo--base.js";
import URLUtil from "../src/url-util.js";

// TODO:
// - Add Intersection observer to know if we're on screen or not
// - What else would we want a web component to do?

// Resources:
// - https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements
// - https://mxb.dev/blog/container-queries-web-components/

class WebComponentDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "Web Component",
      "web-component-container",
      "Testing out the Web Component API with lifecycle event callbacks, container queries, ResizeObserver, custom Event dispatching, and more."
    );
  }

  init() {
    this.addWebComponentsOuterCSS();
    this.addWebComponentsToDOM();
    this.testUpdateComponent();
  }

  addWebComponentsOuterCSS() {
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
  }

  addWebComponentsToDOM() {
    this.el.innerHTML = `
      <custom-element color="#000066"></custom-element>
      <custom-element color="#006600" debug></custom-element>
    `;
  }

  testUpdateComponent() {
    // manually set different attributes from the outside of the component
    this.component = document.querySelector("custom-element");
    this.component.setAttribute("resolution", 200);
    this.component.setAttribute("color", "#444444"); // should trigger attributeChangedCallback()
    this.component.setAttribute("debug", true);

    // query a child in the web component - relies on {mode: "open"}
    let div = this.component.shadowRoot.querySelector("div");
    console.log("Shadow div:", div);

    // listen for custom events
    this.component.addEventListener("colorUpdated", (e) => {
      this.debugEl.innerHTML = "Color updated: " + e.detail.color;
      this.debugEl.innerHTML = "Color updated: " + e.target.curColor();
    });

    // set a different attribute to trigger the callback
    setTimeout(() => {
      this.component.setAttribute("color", "#ff0000");
    }, 1500);
  }
}

// Custom Web Component

class CustomWebComponent extends HTMLElement {
  constructor() {
    super();
    this.renderCount = 0;
    this.el = this.attachShadow({ mode: "open" }); // "open" allows querying and probably lots more
  }

  // Web Component API callbacks --------------------------------------------

  connectedCallback() {
    console.log("Custom element added to page.");
    this.render();
  }

  disconnectedCallback() {
    console.log("Custom element removed from page.");
  }

  adoptedCallback() {
    console.log("Custom element moved to new page.");
  }

  static observedAttributes = ["color"]; // list of properties to watch for changes - these will trigger attributeChangedCallback()

  attributeChangedCallback(name, oldValue, newValue) {
    // only update if it's not the first render and we have a color picker
    if (oldValue != null && name == "color" && this.colorPicker) {
      console.log(`Attribute ${name} has changed.`, oldValue, newValue);
      this.colorPicker.value = newValue;
      this.colorPicked({ target: this.colorPicker });
    }
  }

  // custom code below --------------------------------------------

  initComponent() {
    // get props
    this.defColor = String(this.getAttribute("color")) || "#ff0000";
    const resolution = Number(this.getAttribute("resolution")) || 100;
    const debug = this.hasAttribute("debug");
    const size = { w: resolution, h: resolution };

    // get elements
    this.container = this.el.querySelector(".container");
    this.article = this.el.querySelector("article");

    // remove listeners
    this.resizeObserver?.disconnect();
    this.colorPicker?.removeEventListener("input", this.colorPicked);

    // add color picker listener
    this.colorPicked = !this.colorPicked
      ? this.colorPickedListener.bind(this)
      : this.colorPicked;
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

  curColor() {
    return this.colorPicker.value;
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

  css() {
    return `
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
    `;
  }

  html() {
    return `
      <div class="container">
        <article></article>
        <input class="color" type="color" value="#00ff00" />
      </div>
    `;
  }

  render() {
    this.renderCount++;
    this.el.innerHTML = `
      ${this.html()}
      <style>${this.css()}</style>
    `;
    this.initComponent();
  }
}

customElements.define("custom-element", CustomWebComponent);

if (window.autoInitDemo) window.demo = new WebComponentDemo(document.body);
