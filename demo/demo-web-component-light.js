import DemoBase from "./demo--base.js";

class WebComponentLightDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "Web Component | Light",
      "web-component-light-container",
      "Testing out the Web Component API with the Light DOM technique."
    );
  }

  init() {
    this.addWebComponentsToDOM();
  }

  addWebComponentsToDOM() {
    this.el.innerHTML = /*html*/ `
      <custom-button>
        <button data-message="Hello">Light DOM button</button>
      </custom-button>
      <p>Click to change bg color</p>
    `;
  }
}

// Custom Web Component, in the lightest form possible. Normally we'd have constructor() call super(), but we're keeping it simple here.\
// With LightDom, the we lose some functionality of accessing the shadow DOM elements, but we gain the ability to style the component from the outside, and keep things super simple

class CustomButton extends HTMLElement {
  connectedCallback() {
    this.querySelector("button").addEventListener("click", (e) => {
      var randomColor = Math.floor(Math.random() * 16777215).toString(16);
      document.documentElement.style.backgroundColor = `#${randomColor}`;
      console.log(e.target.getAttribute("data-message"));
    });
  }
}

customElements.define("custom-button", CustomButton);

if (window.autoInitDemo) window.demo = new WebComponentLightDemo(document.body);
