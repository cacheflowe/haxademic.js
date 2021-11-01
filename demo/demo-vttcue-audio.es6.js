import DemoBase from './demo--base.es6.js';

class AudioCueDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [], 'VTTCue | Audio', 'audio-cue-container', 'A simple demo using VTTCues, built programmatically for audio timecode event triggers. Here, each VTTCue\'s "caption" text is stringified JSON.');
  }

  init() {
    // create audio element
    this.sound = document.createElement('audio');
    this.sound.controls = 'controls';
    this.sound.src = '../data/audio/loops/pet-shop-boys-being-boring-beat.mp3';
    this.el.appendChild(this.sound);
    
    // add vttcue objects
    // set the payload as a json string :)
    let track = this.sound.addTextTrack("captions", "Captions", "en");
    track.mode = "showing";
		track.addCue(new VTTCue(0, 1, JSON.stringify({cmd: 'highlight', id: 'cueId-1'}, null, 2)));
		track.addCue(new VTTCue(1, 2, JSON.stringify({cmd: 'highlight', id: 'cueId-2'}, null, 2)));
		track.addCue(new VTTCue(2, 3, JSON.stringify({cmd: 'highlight', id: 'cueId-3'}, null, 2)));
		track.addCue(new VTTCue(3, 4, JSON.stringify({cmd: 'highlight', id: 'cueId-4'}, null, 2)));
    
    // with a normal VTT file, it seems that you can use the ::cue pseudo-element to display the cues
    // if you nest the <track> element inside the <audio/video> tag.
    // since we're creating the cues programatically, we need to display them manually
    // https://developer.mozilla.org/en-US/docs/Web/Guide/Audio_and_video_delivery/Adding_captions_and_subtitles_to_HTML5_video
    this.cueDisplay = document.createElement('pre');
    this.el.appendChild(this.cueDisplay);

    // add listener for timecode/cue changes
    track.addEventListener('cuechange', () => {
      let cues = track.activeCues;  // array of cues for the current timecode
      if(cues.length > 0) {
        let cueVal = cues[0].text;
        let cueJson = JSON.parse(cueVal);
        console.log('cuechange', cueJson.cmd, cueJson.id);
        this.cueDisplay.innerHTML = cueVal;
      } else {
        console.log('cuechange', 'no active cues');
      }
    });

    // play sound
    this.sound.play();
  }

}

if(window.autoInitDemo) window.demo = new AudioCueDemo(document.body);
