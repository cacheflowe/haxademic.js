class DateYear extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    const year = new Date().getFullYear();
    if (this.hasAttribute("useShadow")) {
      const shadow = this.attachShadow({ mode: "open" });
      shadow.innerHTML = `${this.textContent} ${year}`;
    } else {
      this.innerHTML = `${this.textContent} ${year}`;
    }
  }

  static register() {
    customElements.define("date-year", DateYear);
  }
}

DateYear.register();

export { DateYear };
