import DemoBase from "./demo--base.js";
import FrameLoop from "../src/frame-loop.js";
import PointerPos from "../src/pointer-pos.js";

class PointerPosDemo extends DemoBase {
  static CSS = `
    * {
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
    }
    #specific-el {
      width:100%;
      padding: 2rem;
      background: rgba(0,0,0,0.25);
    }
    #specific-el.entered {
      background-color: rgba(0,255,0,0.5);
    }
  `;

  static HTML = `
    <div>
      <div><code>PointerPos.isTouching()</code> = <span id="is-touching"></span></div>
      <div><code>PointerPos.isTouchInput()</code> = <span id="is-touch-input"></span></div>
      <div><code>PointerPos.x()</code> = <span id="pos-x"></span></div>
      <div><code>PointerPos.y()</code> = <span id="pos-y"></span></div>
      <div><code>PointerPos.xNorm()</code> = <span id="pos-x-percent"></span></div>
      <div><code>PointerPos.yNorm()</code> = <span id="pos-y-percent"></span></div>
      <div><code>PointerPos.xDelta()</code> = <span id="pos-x-delta"></span></div>
      <div><code>PointerPos.yDelta()</code> = <span id="pos-y-delta"></span></div>
      <div><code>PointerPos.xDeltaTotal()</code> = <span id="pos-x-delta-total"></span></div>
      <div><code>PointerPos.yDeltaTotal()</code> = <span id="pos-y-delta-total"></span></div>
      <div><code>PointerPos.numPointers()</code> = <span id="num-pointers"></span></div>
      <div id="specific-el">
        <div>Specific element relative position:</div>
        <div><code>PointerPos.x(el)</code> = <span id="specific-pos-x"></span></div>
        <div><code>PointerPos.y(el)</code> = <span id="specific-pos-y"></span></div>
        <div><code>PointerPos.xNorm(el)</code> = <span id="specific-pos-x-percent"></span></div>
        <div><code>PointerPos.yNorm(el)</code> = <span id="specific-pos-y-percent"></span></div>
        <div><code>PointerPos.insideEl(el)</code> = <span id="specific-pos-inside"></span></div>
      </div>
      <button id="button-drag">Button - check drag thresh</button>
    </div>
  `;

  constructor(parentEl) {
    super(
      parentEl,
      [],
      "PointerPos",
      "pointer-pos-container",
      "Pointer position tracking"
    );
  }

  init() {
    this.injectCSS(PointerPosDemo.CSS);
    this.injectHTML(PointerPosDemo.HTML);
    window._frameLoop = new FrameLoop().addListener(this);
    this.initPointerPos();
  }

  // init pointer pos and inline logging elements

  initPointerPos() {
    // init pointerPos with callbacks
    let callbackMove = this.onPointerMove.bind(this);
    let callbackStart = this.onPointerStart.bind(this);
    let callbackEnd = this.onPointerEnd.bind(this);
    this.pointerPos = new PointerPos(callbackMove, callbackStart, callbackEnd);

    // specific element tracking
    this.specificEl = document.getElementById("specific-el");
    this.specificEntered = false;

    // log dragged state & distance
    this.outputIsTouching = document.getElementById("is-touching");
    this.outputIsTouchInput = document.getElementById("is-touch-input");
    this.outputTextPosX = document.getElementById("pos-x");
    this.outputTextPosY = document.getElementById("pos-y");
    this.outputTextPosxNorm = document.getElementById("pos-x-percent");
    this.outputTextPosyNorm = document.getElementById("pos-y-percent");
    this.outputTextXDelta = document.getElementById("pos-x-delta");
    this.outputTextYDelta = document.getElementById("pos-y-delta");
    this.outputTextXDeltaTotal = document.getElementById("pos-x-delta-total");
    this.outputTextYDeltaTotal = document.getElementById("pos-y-delta-total");
    this.outputTextNumPointers = document.getElementById("num-pointers");
    // var crossHairX = document.querySelector('body > .crosshair-h');
    // var crossHairY = document.querySelector('body > .crosshair-v');

    // specific el position
    this.outputTextSpecificPosX = document.getElementById("specific-pos-x");
    this.outputTextSpecificPosY = document.getElementById("specific-pos-y");
    this.outputTextSpecificPosxNorm = document.getElementById(
      "specific-pos-x-percent"
    );
    this.outputTextSpecificPosyNorm = document.getElementById(
      "specific-pos-y-percent"
    );
    this.outputTextSpecificInside = document.getElementById(
      "specific-pos-inside"
    );

    // button drag
    this.buttonDrag = document.getElementById("button-drag");
    this.buttonDrag.addEventListener("click", (e) => {
      if (this.pointerPos.pastDragThreshold()) {
        console.log("clicked, but should be canceled");
      } else {
        console.log("clicked!");
      }
    });
  }

  // callbacks

  onPointerMove() {
    console.log("MOVE!");
  }

  onPointerStart() {
    console.log("START!");
  }

  onPointerEnd() {
    console.log("END!");
  }

  // animation updates

  frameLoop(frameCount) {
    // general properties
    this.outputIsTouching.innerHTML = this.pointerPos.isTouching();
    this.outputIsTouchInput.innerHTML = this.pointerPos.isTouchInput();
    this.outputTextPosX.innerHTML = this.pointerPos.x();
    this.outputTextPosY.innerHTML = this.pointerPos.y();
    this.outputTextPosxNorm.innerHTML = (this.pointerPos.xNorm() + "").substr(
      0,
      4
    );
    this.outputTextPosyNorm.innerHTML = (this.pointerPos.yNorm() + "").substr(
      0,
      4
    );
    this.outputTextXDelta.innerHTML = this.pointerPos.xDelta();
    this.outputTextYDelta.innerHTML = this.pointerPos.yDelta();
    this.outputTextXDeltaTotal.innerHTML = this.pointerPos.xDeltaTotal();
    this.outputTextYDeltaTotal.innerHTML = this.pointerPos.yDeltaTotal();
    this.outputTextNumPointers.innerHTML = this.pointerPos.numPointers();
    // specific el
    this.outputTextSpecificPosX.innerHTML = this.pointerPos.x(this.specificEl);
    this.outputTextSpecificPosY.innerHTML = this.pointerPos.y(this.specificEl);
    this.outputTextSpecificPosxNorm.innerHTML = (
      this.pointerPos.xNorm(this.specificEl) + ""
    ).substring(0, 4);
    this.outputTextSpecificPosyNorm.innerHTML = (
      this.pointerPos.yNorm(this.specificEl) + ""
    ).substring(0, 4);
    let insideSpecificEl = this.pointerPos.insideEl(this.specificEl);
    this.outputTextSpecificInside.innerHTML = insideSpecificEl + "";
    if (insideSpecificEl) {
      this.specificEl.classList.add("entered");
    } else {
      this.specificEl.classList.remove("entered");
    }
  }
}

if (window.autoInitDemo) window.demo = new PointerPosDemo(document.body);
