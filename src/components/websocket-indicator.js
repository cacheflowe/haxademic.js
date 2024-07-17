class WebsocketIndicator extends HTMLElement {
  connectedCallback() {
    this.shadow = this.attachShadow({ mode: "open" });
    this.listenForBodyClassChanges();
    this.render();
    this.div = this.shadow.querySelector("div");
    this.initClickListener();
  }

  listenForBodyClassChanges() {
    // watch for changes on <body>'s classList, so we can respond
    var observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName == "class") {
          this.updateIndicator();
        }
      });
    });
    observer.observe(document.body, { attributes: true });
  }

  initClickListener() {
    this.div.addEventListener("click", () => {
      _store.set("SHOW_DEBUG", !_store.get("SHOW_DEBUG"));
    });
  }

  updateIndicator() {
    if (!this.div) return;
    if (document.body.classList.contains("no-socket")) {
      this.div.classList.add("no-socket");
    } else {
      this.div.classList.remove("no-socket");
    }
  }

  html() {
    return /*html*/ `
      <div></div>
    `;
  }

  css() {
    return /*css*/ `
      div {
        position: absolute;
        top: 1rem;
        left: 1rem;
        width: 20px; 
        height: 20px; 
        border-radius: 10px;
        background-color: #33ff33;
      }
      div.no-socket {
        background-color: #ff3333;
      }
    `;
  }

  render() {
    this.shadow.innerHTML = /*html*/ `
      ${this.html()}
      <style>
        ${this.css()}
      </style>
    `;
  }

  static register() {
    customElements.define("websocket-indicator", WebsocketIndicator);
  }
}

WebsocketIndicator.register();

export default WebsocketIndicator;
