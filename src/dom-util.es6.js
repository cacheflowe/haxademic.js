class DOMUtil {
  static closest(element, selector) {
    selector = selector.toLowerCase();
    let className =
      selector.split(".").length > 1 ? selector.split(".")[1] : "";
    selector = selector.split(".")[0];
    while (true) {
      if (
        element.nodeName.toLowerCase() === selector &&
        element.className.indexOf(className) !== -1
      ) {
        return element;
      }
      if (!(element = element.parentNode)) {
        break;
      }
    }
    return null;
  }

  static remove(el) {
    if (el && el.parentNode) {
      return el.parentNode.removeChild(el);
    }
    return null;
  }

  static stringToElement(str) {
    let doc = new DOMParser().parseFromString(str, "text/html");
    return doc.body.firstElementChild;
  }

  static stringToDomElement(str) {
    let div = document.createElement("div");
    div.innerHTML = str;
    return div.firstChild;
  }

  static elementToString(el) {
    return el.outerHTML;
  }

  static addLoadedClass(delay = 1000, className = "ready") {
    // add class to enable animation a moment after window load
    window.addEventListener("load", (e) => {
      setTimeout(() => {
        document.body.classList.add(className);
      }, delay);
    });
  }

  static isElementVisible(el) {
    var rect = el.getBoundingClientRect();
    return (
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.left < (window.innerWidth || document.documentElement.clientWidth) &&
      rect.top < (window.innerHeight || document.documentElement.clientHeight)
    );
  }

  static dispatchResize() {
    window.dispatchEvent(new Event("resize"));
  }

  static loadJavascript(url, callback = null, type = null) {
    const script = document.createElement("script");
    if (!!type) script.setAttribute("type", type);
    if (callback) script.addEventListener("load", callback);
    script.src = url;
    document.head.appendChild(script);
    return script;
  }

  static injectScriptSync(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.addEventListener("load", resolve);
      script.addEventListener("error", (e) => reject(e.error));
      document.head.appendChild(script);
    });
  }

  static loadCSS(url) {
    const cssTag = document.createElement("link");
    cssTag.setAttribute("rel", "stylesheet");
    cssTag.setAttribute("href", url);
    document.head.appendChild(cssTag);
    return cssTag;
  }

  static injectCSS(cssString) {
    const styleEl = document.createElement("style");
    styleEl.textContent = cssString;
    document.head.append(styleEl);
    return styleEl;
  }

  static recurseDisableElements(elem, disabledElements) {
    if (elem) {
      // disable clicking/dragging on selected element types
      if (
        elem.tagName &&
        disabledElements.indexOf(elem.tagName.toLowerCase()) != -1
      ) {
        //  console.log('disabling: = '+elem.tagName.toLowerCase());
        try {
          elem.onmousedown = function (e) {
            return false;
          }; // TODO: remove this if touch events, so we can click inside??
          elem.onselectstart = function () {
            return false;
          };
        } catch (err) {}
      }
      // loop through children and do the same
      if (elem.childNodes.length > 0) {
        for (var i = 0; i < elem.childNodes.length; i++) {
          DOMUtil.recurseDisableElements(elem.childNodes[i], disabledElements);
        }
      }
    }
  }
}

export default DOMUtil;
