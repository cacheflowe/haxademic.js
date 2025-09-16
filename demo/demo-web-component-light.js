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
    this.el.innerHTML = /*html*/ `
      <custom-button>
        <button data-message="Hello">Light DOM button 1</button>
      </custom-button>
      <custom-button>
        <button data-message="Hello">Light DOM button 2</button>
      </custom-button>
      <p>Click to change bg color</p>
    `;
  }
}

// Custom Web Component, in the lightest form possible. Normally we'd have constructor() that calls super(), but we're keeping it simple here.
// With Light DOM, the we lose some functionality of accessing the shadow DOM elements, but we gain the ability to style the component from the outside, and keep things super simple

class CustomButton extends HTMLElement {
  connectedCallback() {
    this.querySelector("button").addEventListener("click", (e) => {
      var randomColor = Math.floor(Math.random() * 16777215).toString(16);
      document.documentElement.style.backgroundColor = `#${randomColor}`;
      console.log(e.target.getAttribute("data-message"));
    });
  }

  static css = /*css*/ `
    custom-button button {
      border-radius: 4px;
      padding: 1rem 2rem;
      cursor: pointer;
    }
  `;

  static register() {
    if ("customElements" in window) {
      window.customElements.define("custom-button", CustomButton);

      // Only add the style once, so multiple components don't keep adding more instances
      let styleId = "custom-button-style";
      if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = CustomButton.css;
        document.head.appendChild(style);
      }
    }
  }
}

CustomButton.register();

if (window.autoInitDemo) window.demo = new WebComponentLightDemo(document.body);
