class SpinnerAnim extends HTMLElement {
  connectedCallback() {
    // this.shadow = this.attachShadow({ mode: "open" });
    this.el = this.shadow ? this.shadow : this;
    this.render();
  }

  html() {
    // from: https://github.com/shoelace-style/shoelace/blob/next/src/components/spinner/spinner.styles.ts
    return /*html*/ `
      <svg class="spinner" role="progressbar">
        <circle class="spinner__track"></circle>
        <circle class="spinner__indicator"></circle>
      </svg>
    `;
  }

  css() {
    return /*css*/ `
      spinner-anim {
        --track-width: 2px;
        --track-color: var(--pico-secondary-underline);
        --indicator-color: var(--pico-color);
        --speed: 2s;

        display: inline-flex;
        width: 1em;
        height: 1em;
        flex: none;
      }

      .spinner {
        flex: 1 1 auto;
        height: 100%;
        width: 100%;
      }

      .spinner__track,
      .spinner__indicator {
        fill: none;
        stroke-width: var(--track-width);
        r: calc(0.5em - var(--track-width) / 2);
        cx: 0.5em;
        cy: 0.5em;
        transform-origin: 50% 50%;
      }

      .spinner__track {
        stroke: var(--track-color);
        transform-origin: 0% 0%;
      }

      .spinner__indicator {
        stroke: var(--indicator-color);
        stroke-linecap: round;
        stroke-dasharray: 150% 75%;
        animation: spin var(--speed) linear infinite;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
          stroke-dasharray: 0.05em, 3em;
        }

        50% {
          transform: rotate(450deg);
          stroke-dasharray: 1.375em, 1.375em;
        }

        100% {
          transform: rotate(1080deg);
          stroke-dasharray: 0.05em, 3em;
        }
      }
    `;
  }

  render() {
    this.el.innerHTML = /*html*/ `
      ${this.html()}
      <style>
        ${this.css()}
      </style>
    `;
  }

  static register() {
    customElements.define("spinner-anim", SpinnerAnim);
  }
}

SpinnerAnim.register();

export default SpinnerAnim;
