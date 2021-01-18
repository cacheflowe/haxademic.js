class SpeechRecognizer {

  // info:
  // - https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API
  // - https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
  // - https://github.com/mdn/web-speech-api
  // - https://www.google.com/intl/en/chrome/demos/speech.html
  // - https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/continuous

  // Right now we're sending back all potential matches
  // to cast a wider net. Another mode could watch the current
  // `transcript` and return the confirmed sentences as they build

  constructor(wordCallback=null, debugEl=null) {
    this.wordCallback = wordCallback;
    this.debugEl = debugEl;
    this.recentWords = [];
    this.recentWordCap = 20;
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
    if(!!e) {
      for (var i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          // when the talking stops for long enough, we get a final result:
          // console.log('Final:', e.results[i][0].transcript);
        } else {
          // otherwise, while talking, we get the realtime sentence added to as words are recognized
          // interim results is the entire paragraph until a long break signals the recognizer to give a 'final' result
          let confidence = e.results[i][0].confidence;  // seems to not really work
          let curSentence = e.results[i][0].transcript;
          // grab last word in sentence
          let lastIndexOfSpace = curSentence.lastIndexOf(' ');
          let lastWord = curSentence.substring(lastIndexOfSpace + 1).toLowerCase();
          // check if new word is in the most recent words array, and if so, store it
          if(this.hasWord(lastWord) == false) {
            if(this.wordCallback) this.wordCallback(lastWord);
            this.recentWords.push(lastWord);
            this.logWord(lastWord);
          }
          // truncate recent word list, FIFO
          if(this.recentWords.length > this.recentWordCap) {
            let removedWord = this.recentWords.shift();
          }
        }
      }
    }
  }

  hasWord(newWord) {
    for (let i = 0; i < this.recentWords.length; i++) {
      let word = this.recentWords[i];
      if(newWord == word) return true;
    }
    return false;
  }

  logWord(newWord) {
    // add last word to the log
    if(this.debugEl && newWord) this.debugEl.innerHTML += `<div>${newWord}</div>`;
    // truncate log
    while(this.debugEl.childNodes.length > 20) {
      var el = this.debugEl.childNodes[0];
      el.parentNode.removeChild(el);
    }
  }

  onRecognitionEnd(e) {
    this.recognizing = false;
    console.log('SpeechRecognition.end()');
  }

}

export default SpeechRecognizer;
