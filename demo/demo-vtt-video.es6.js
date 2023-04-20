import DemoBase from "./demo--base.es6.js";

class VTTVideoDemo extends DemoBase {
  constructor(parentEl) {
    super(
      parentEl,
      [],
      "VTT Video",
      "video-cue-container",
      'A simple example of a video with VTT subtitles using the native WebVTT API. More info <a href="https://developer.mozilla.org/en-US/docs/Web/Guide/Audio_and_video_delivery/Adding_captions_and_subtitles_to_HTML5_video" target="_blank">here</a>.'
    );
  }

  init() {
    this.el.innerHTML = `
      <video id="video" controls preload loop playsline style="width:100%">
        <source src="../data/videos/wash-your-hands.mp4" type="video/mp4">
        <track label="English" kind="subtitles" srclang="en" src="../data/videos/wash-your-hands.vtt" default>
      </video>
    `;
  }
}

if (window.autoInitDemo) window.demo = new VTTVideoDemo(document.body);
