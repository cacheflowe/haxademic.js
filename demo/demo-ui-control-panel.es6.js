class UIControlPanelDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [
      "../vendor/guify.min.js",
      "../src/ui-control-panel.es6.js",
    ], `
      <div class="container">
        <div id="gui-container" style="position: fixed; top: 0; right: 0; width: 300px;"></div>
        <h1>UIControlPanel</h1>
        <div id="debug"></div>
      </div>
    `);
  }

  init() {
    // setup
    let guiParent = document.getElementById('gui-container');
    window._ui = new UIControlPanel(guiParent, "UI Demo!");
    this.debugEl = document.getElementById('debug');
    this.initUI();
    // _ui.hide();
  }

    initUI() {
    // Populate the GUI
    _ui.addTitle('Sliders');
    _ui.addSlider('Slider', 'rangeVal', 5, 0, 100);
    _ui.addSlider('Slider Stepped', 'rangeStepVal', 5, 0, 100, 5);
    _ui.addSliderRange('Interval', 'intervalVal', [15,30], 5, 75);
    _ui.addSliderRange('Interval Stepped', 'intervalStepVal', [15,30], 5, 75, 5);
    _ui.addTitle('Buttons');
    _ui.addButton('Cool button', 'coolButton');
    _ui.addCheckbox('Checkbox', 'chexBox', true);
    _ui.addTitle('Text');
    _ui.addString('A String', 'stringValue', 'Some text here');
    _ui.addTitle('Color');
    _ui.addColor('Hex Color', 'colorHex', '#ff00ff');
    _ui.addColor('RGB Color', 'colorRGB', 'rgb(0, 255, 255)');
    _ui.addTitle('Select');
    _ui.addDropdown('Options', 'select', 'One', ['One', 'Two', 'Three']);
    _ui.addTitle('File');
    _ui.addFile('Image File', 'imageUpload');

    _ui.loadLocalStorage();

    // listen for all updates via `guiValueUpdated`
    _ui.addListener(this);
    // listen to specific keys with named callback
    // _ui.addListener(this, 'rangeVal');
    _ui.addListener(this, 'coolButton');
  }



  // updated gui values callbacks

  guiValueUpdated(key, value) {
    this.log('guiValueUpdated: "' + key + '" = ' + value);
  }

  rangeVal(value) {
    this.log('rangeVal = ' + value);
  }

  coolButton(value) {
    this.log('coolButton clicked');
    this.log('rangeVal val = ' + _ui.value('rangeVal'));
  }

  imageUpload(value) {
    console.log(value);
  }

  // log to DOM

  log(message) {
    this.debugEl.innerHTML += `<div>${message}</div>`;
    // truncate log
    while(this.debugEl.childNodes.length > 20) {
      var el = this.debugEl.childNodes[0];
      el.parentNode.removeChild(el);
    }
  }

}

if(window.autoInitDemo) new UIControlPanelDemo(document.body);
