class SpeechRecognizer {

  // info:
  // - https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API
  // - https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
  // - https://github.com/mdn/web-speech-api
  // - https://www.google.com/intl/en/chrome/demos/speech.html
  // - https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/continuous

  constructor(debugEl=null) {
    this.debugEl = debugEl;
    // setup - must be called from a button click
    if (!('webkitSpeechRecognition' in window)) alert("Browser doesn't support SpeechRecognition");
    else {
      this.recognition = new webkitSpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;
      this.recognition.addEventListener('start', (e) => { this.onRecognitionStart(e); });
      this.recognition.addEventListener('error', (e) => { this.onRecognitionError(e); });
      this.recognition.addEventListener('end', (e) => { this.onRecognitionError(e); });
      this.recognition.addEventListener('result', (e) => { this.onRecognitionResult(e); });
      // more events
      this.recognition.addEventListener('audiostart', (e) => { console.log('audiostart', e) });
      this.recognition.addEventListener('audioend', (e) => {
        console.log('audioend', e);
        // if auto timeout, fire it back up!
        setTimeout(() => {
          this.recognition.stop();
          this.recognition.start();
        }, 1000);
      });
      this.recognition.addEventListener('soundstart', (e) => { console.log('soundstart', e) });
      this.recognition.addEventListener('soundend', (e) => { console.log('soundend', e) });
      this.recognition.addEventListener('speechstart', (e) => { console.log('speechstart', e) });
      this.recognition.addEventListener('speechend', (e) => { console.log('speechend', e) });
      this.recognition.addEventListener('nomatch', (e) => { console.log('nomatch', e) });
      this.recognition.start();
    }
  }

  // PUBLIC API

  start() {
    if(!this.recognizing) this.recognition.start();
  }

  stop() {
    if(this.recognizing) {
      this.recognition.stop();
      this.recognizing = false;
    }
  }

  // SpeechRecognition event listeners

  onRecognitionStart(e) {
    this.recognizing = true;
    console.log('SpeechRecognition.start()');
  }

  onRecognitionError(e) {
    if (event.error == 'no-speech') console.log('SpeechRecognition.error("no-speech")');
    if (event.error == 'audio-capture') console.log('SpeechRecognition.error("no-microphone")');
    if (event.error == 'not-allowed') console.log('SpeechRecognition.error("blocked/denied")');
    // this.recognizing = false;
  }

  onRecognitionResult(e) {
    console.log('SpeechRecognition.result()');
    // if (typeof(event.results) == 'undefined') {
    //   this.recognition.onend = null;
    //   this.recognition.stop();
    //   upgrade();
    //   return;
    // }
    if(!!e) {
      for (var i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          console.log('Final:', e.results[i][0].transcript);
        } else {
          // console.log('Interim:', e.results[i][0].transcript);
          // console.log(e.results[i]);
          // add last word to the log
          // interim results is the entire paragraph until a long break signals the recognizer to give a 'final' result
          let wordsArr = e.results[i][0].transcript.split(' ');
          if(this.debugEl != null && wordsArr.length > 0) this.debugEl.innerHTML += `<div>${wordsArr[wordsArr.length - 1]}</div>`;
          // truncate log
          while(this.debugEl.childNodes.length > 20) {
            var el = this.debugEl.childNodes[0];
            el.parentNode.removeChild(el);
          }

        }
      }
    }
  }

  onRecognitionEnd(e) {
    this.recognizing = false;
    console.log('SpeechRecognition.end()');
  }

}

/*

var two_line = /\n\n/g;
var one_line = /\n/g;
function linebreak(s) {
  return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
}

var first_char = /\S/;
function capitalize(s) {
  return s.replace(first_char, function(m) { return m.toUpperCase(); });
}

*/
