class UIControlPanel {

  // data & event wrapper for: https://github.com/colejd/guify
  // TODO: add to localStorage
  // TODO: fix CSS that's getting mangled by barebones.css

  constructor(container=document.body, title="App Controls") {
    if(!guify) throw new Error('UIControlPanel requires guify');
    this.el = container;
    this.title = title;

    this.data = {};
    this.listeners = [];
    this.methods = {};

    this.init();
    this.fixStyles();
  }

  init(container) {
    // Create the GUI
    // https://github.com/colejd/guify/blob/master/example/index.html
    this.gui = new guify({
      title: this.title,
      theme: 'dark', // dark, light, yorha, or theme object
      align: 'right', // left, right
      width: 300,
      barMode: 'offset', // none, overlay, above, offset
      panelMode: 'inner',
      opacity: 0.95,
      root: this.el,
      open: true
    });
  }

  loadLocalStorage() {
    return console.warn('UIControlPanel.loadLocalStorage() needs to handle type conversion');
    for (const key in this.data) {
      console.log(key);
      if(localStorage.getItem(key)) {
        console.log('loading...', key, localStorage.getItem(key));
        this.data[key] = localStorage.getItem(key);
      }
    }
  }

  // override barebones button styles

  fixStyles() {
    let resetProps = ['font-size', 'font-weight', 'line-height', 'text-transform', 'letter-spacing', 'border-radius']; // 'text-align',
    this.gui.bar.element.childNodes.forEach((el) => {
      resetProps.forEach((prop) => {
        el.style[prop] = 'inherit';
      });
    });
  }

  // event listening

  addListener(obj, key) {
    if(key) {
      if(!this.methods[key]) this.methods[key] = [];
      this.methods[key].push(obj);
    } else {
      this.listeners.push(obj);
    }
  }

  removeListener(obj, key) {
    if(key) {
      if(this.methods[key]) {
        const index = this.methods[key].indexOf(obj);
        if (index !== -1) this.methods[key].splice(index, 1);
      }
    } else {
      const index = this.listeners.indexOf(obj);
      if (index !== -1) this.listeners.splice(index, 1);
    }
  }

  valueUpdated(key, value) {
    // save in localStorage
    localStorage.setItem(key, value);
    // dispatch!
    this.listeners.forEach((el, i, arr) => {
      el.guiValueUpdated(key, value);
    });
    // specific listener methods
    const objs = this.methods[key];
    if(objs) {
      objs.forEach((el) => {
        if(el[key]) el[key](value);
        else throw new Error('UIControlPanel listener has no callback: ' + key);
      });
    }
  }

  // create components

  addTitle(label) {
    this.gui.Register({
      type: UIControlPanel.TYPE_TITLE,
      label: label,
    });
  }

  addButton(label, key) {
    this.gui.Register({
      type: UIControlPanel.TYPE_BUTTON,
      label: label,
      action: () => {
        this.valueUpdated(key, true);
      }
    });
  }

  addFile(label, key) {
    this.addComponent(UIControlPanel.TYPE_FILE, label, key);
  }

  addColor(label, key, value) {
    this.addComponent(UIControlPanel.TYPE_COLOR, label, key, value);
  }

  addCheckbox(label, key, value) {
    this.addComponent(UIControlPanel.TYPE_CHECKBOX, label, key, value);
  }

  addString(label, key, value) {
    this.addComponent(UIControlPanel.TYPE_TEXT, label, key, value);
  }

  addSlider(label, key, value, min, max) {
    this.addComponent(UIControlPanel.TYPE_RANGE, label, key, value, min, max);
  }

  addSliderRange(label, key, value, min, max, step) {
    this.addComponent(UIControlPanel.TYPE_INTERVAL, label, key, value, min, max, step);
  }

  addDropdown(label, key, value, options) {
    this.addComponent(UIControlPanel.TYPE_SELECT, label, key, value, null, null, null, options);
  }

  addComponent(componentType, label, key, value=null, min=null, max=null, step=null, options=null) {
    this.data[key] = value;
    let config = {
      type: componentType,
      label: label,
      object: this.data,
      property: key,
      onChange: (data) => {
        this.valueUpdated(key, data);
      }
    }
    if(min != null) config.min = min;
    if(max != null) config.max = max;
    if(step != null) config.step = step;
    if(options != null) config.options = options;
    if(componentType == UIControlPanel.TYPE_COLOR) config.format = (value.indexOf('#') == 0) ? 'hex' : 'rgb';
    this.gui.Register(config);
  }

  // getter

  value(key) {
    return this.data[key];
  }

  // set value externally

  setValue(key, value) {
    this.data[key] = value;
  }

  // show/hide

  show() {
    this.el.style.display = 'block';
  }

  hide() {
    this.el.style.display = 'none';
  }

  // toast message

  toast(message) {
    gui.Toast(message);
  }

}

UIControlPanel.TYPE_RANGE = 'range';
UIControlPanel.TYPE_INTERVAL = 'interval';
UIControlPanel.TYPE_TITLE = 'title';
UIControlPanel.TYPE_BUTTON = 'button';
UIControlPanel.TYPE_CHECKBOX = 'checkbox';
UIControlPanel.TYPE_SELECT = 'select';
UIControlPanel.TYPE_TEXT = 'text';
UIControlPanel.TYPE_COLOR = 'color';
UIControlPanel.TYPE_FILE = 'file';

export default UIControlPanel;
