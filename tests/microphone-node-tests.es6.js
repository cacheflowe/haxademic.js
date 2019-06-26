/////////////////////////////////////////////
// DOM tests
/////////////////////////////////////////////

// header
mainEl.appendChild(DOMUtil.stringToDomElement("<h1>MicrophoneNode</h1>"));

// add container to attach FFT debug canvas
insertHtmlStr(`<div id="fft-container"></div>`);
let fftEl = document.getElementById('fft-container');
var fftAttached = false;

// init microphone
let soundFFT = null;
const mic = new MicrophoneNode(null, () => {
  soundFFT = new SoundFFT(mic.getContext(), mic.getNode());
}, (error) => {
  fftEl.innerHTML = '[MicrophoneNode ERROR] :: ' + error;
});

// animate fft debug canvas
function animateFFT() {
  requestAnimationFrame(() => {
    animateFFT();
    if(soundFFT) {
      soundFFT.update();
      soundFFT.drawDebug();
      if(!fftAttached) {
        fftAttached = true;
        fftEl.appendChild(soundFFT.getDebugCanvas());
        soundFFT.getDebugCanvas().setAttribute('style', null);
      }
    }
  });
}
animateFFT();

// break
insertHtmlStr('<hr/>');

/////////////////////////////////////////////
// Unit tests
/////////////////////////////////////////////
