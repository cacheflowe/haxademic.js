/////////////////////////////////////////////////////////////
// Demo code
/////////////////////////////////////////////////////////////

var pointerPosHTML = `<div>
  <div class="row">
    <div class="six columns">
      <p><code>PointerPos.x()</code>: <span id="pos-x"></span></p>
    </div>
    <div class="six columns">
      <p><code>PointerPos.y()</code>: <span id="pos-y"></span></p>
    </div>
  </div>
  <div class="row">
    <div class="six columns">
      <p><code>PointerPos.xNorm()</code>: <span id="pos-x-percent"></span></p>
    </div>
    <div class="six columns">
      <p><code>PointerPos.yNorm()</code>: <span id="pos-y-percent"></span></p>
    </div>
  </div>
  <div class="row">
    <div class="six columns">
      <p><code>PointerPos.xDelta()</code>: <span id="drag-x-delta"></span></p>
    </div>
    <div class="six columns">
      <p><code>PointerPos.yDelta()</code>: <span id="drag-y-delta"></span></p>
    </div>
  </div>
  <p>If you want to track your pointer within a specific element, pass an element into the same methods: <code>PointerPos.x(el)</code>:</p>
  <div class="row">
    <div id="specific-el" class="twelve columns" style="padding: 20px; background: rgba(0,0,0,0.25);">
      <div>
        Specific element relative position: <span id="specific-pos-x"></span>, <span id="specific-pos-y"></span>
      </div>
      <div>
        Specific element relative percent: <span id="specific-pos-x-percent"></span>, <span id="specific-pos-y-percent"></span>
      </div>
    </div>
  </div>
</div>`;
mainEl.appendChild(DOMUtil.stringToDomElement("<h1>PointerPos</h1>"));
mainEl.appendChild(DOMUtil.stringToDomElement(pointerPosHTML));

//
let pointerPos = new PointerPos();

// specific element tracking
var specificEl = document.getElementById('specific-el');
var specificEntered = false;

// log dragged state & distance
var outputTextPosX = document.getElementById('pos-x');
var outputTextPosY = document.getElementById('pos-y');
var outputTextPosxNorm = document.getElementById('pos-x-percent');
var outputTextPosyNorm = document.getElementById('pos-y-percent');
var outputTextXDelta = document.getElementById('drag-x-delta');
var outputTextYDelta = document.getElementById('drag-y-delta');
// var crossHairX = document.querySelector('body > .crosshair-h');
// var crossHairY = document.querySelector('body > .crosshair-v');

var outputTextSpecificPosX = document.getElementById('specific-pos-x');
var outputTextSpecificPosY = document.getElementById('specific-pos-y');
var outputTextSpecificPosxNorm = document.getElementById('specific-pos-x-percent');
var outputTextSpecificPosyNorm = document.getElementById('specific-pos-y-percent');

function logUpdates() {
  requestAnimationFrame(() => {
    outputTextPosX.innerHTML = pointerPos.x();
    outputTextPosY.innerHTML = pointerPos.y();
    outputTextPosxNorm.innerHTML = (pointerPos.xNorm()+"").substr(0,4);
    outputTextPosyNorm.innerHTML = (pointerPos.yNorm()+"").substr(0,4);
    outputTextXDelta.innerHTML = pointerPos.xDelta();
    outputTextYDelta.innerHTML = pointerPos.yDelta();

    outputTextSpecificPosX.innerHTML = pointerPos.x(specificEl);
    outputTextSpecificPosY.innerHTML = pointerPos.y(specificEl);
    outputTextSpecificPosxNorm.innerHTML = (pointerPos.xNorm(specificEl)+"").substr(0,4);
    outputTextSpecificPosyNorm.innerHTML = (pointerPos.yNorm(specificEl)+"").substr(0,4);

    if(pointerPos.xNorm(specificEl) >= 0 && pointerPos.xNorm(specificEl) <= 1 && pointerPos.yNorm(specificEl) >= 0 && pointerPos.yNorm(specificEl) <= 1) {
      if(specificEntered == false) {
        specificEntered = true;
        specificEl.classList.add('entered');
      }
    } else {
      if(specificEntered == true) {
        specificEntered = false;
        specificEl.classList.remove('entered');
      }
    }
  });
};

document.addEventListener('mousedown', logUpdates);
document.addEventListener('touchstart', logUpdates);
document.addEventListener('mousemove', logUpdates);
document.addEventListener('touchmove', logUpdates);

// break
insertHtmlStr('<hr/>');
