# Haxademic.js

A personal front-end JavaScript toolkit

# Demo / Tests

[Tests](https://cacheflowe.github.io/haxademic.js/)
[Demos](https://cacheflowe.github.io/haxademic.js/demo)

# TODO

* <video> to SoundFFT test/demo -  https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createMediaElementSource
* MIDI learn - work into dat.gui refactor from old gui library
* Field trip video textures w/UIControlPanel & LED mapping


* Begin integrating html-experiments repo?
* Switch to dat.gui. whoops
* Assimilate & kill:
  * pointer-pos
  * did-drag repos
  * imagexpander
  * cacheflowe.com music player!
    * make inline version in addition to global player
* Someday convert class constants to static fields: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Class_fields#Browser_compatibility
* Bring in Howler.js & Tone.js & wavesurfer.js
* Add a tiny shader example for: http://twgljs.org/#examples - would be nice to have lightweight shader views inline
* Integrate with SimpleSite? Probably not...
* QR code generator for peer connections
* VJ stream
  * Video to pixi canvas
  * Look at audio node from <video> source for FFT on video: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createMediaElementSource
  * MIDI learn
  * PIXI shader swapping & particles
* Investigate:
  * New html features
    * ResizeObserver: https://webkit.org/blog/9997/resizeobserver-in-webkit/
  * Touchless interfaces
    * WebRTC: 
      * https://peerjs.com/
      * https://webrtc.org/getting-started/media-devices
      * https://webrtc.github.io/samples/
      * https://blog.bitsrc.io/build-a-webcam-communication-app-using-webrtc-9737384e84be
      * https://www.html5rocks.com/en/tutorials/webrtc/basics/
      * https://gabrieltanner.org/blog/webrtc-video-broadcast
      * https://bloggeek.me/media-server-for-webrtc-broadcast/
      * https://jitsi.org/projects/
      * https://github.com/jitsi/jitsi-meet/blob/master/doc/api.md
      * https://bitmovin.com/mpeg-dash-hls-examples-sample-streams/
      * http://rdmedia.bbc.co.uk/dash/ondemand/bbb/
      * http://rdmedia.bbc.co.uk/
      * https://github.com/pipe/bookclub/blob/master/index.html
      * https://bloggeek.me/webrtc-js-library-to-use/
      * https://www.callstats.io/blog/2017/10/26/turn-webrtc-products
    * Websocket negotiation & private channels:
      * https://www.npmjs.com/package/websocket
      * https://medium.com/@martin.sikora/node-js-websocket-simple-chat-tutorial-2def3a841b61 * https://gist.github.com/martinsik/2031681
      * https://github.com/rustigano/node-websocket-chatserver
    * Accelerometer for TV remote cursor demo
    * Mobile touchscreen as mouse cursor - added to PointerUtil
      * Also, transparent Java app version!?
    * Lip-reading/presence to kick off voice recognition listening
    * Virtual scrollwheel on a touchscreen to scroll a 2nd screen
    * Hand gestures! (use that new (tensorflow?) hand-tracking library)
    * Voice recognition
      * https://syl22-00.github.io/pocketsphinx.js/
      * Sphinx4
      * Web SpeechRecognition API
    * Depth & Web cameras
      * Computer vision tools
      * Kinect Blob to segment and then calculate hand from gradient depth data
    * LeapMotion
    * Adruino sensors
      * https://www.adafruit.com/product/3317
        * https://github.com/leonyuhanov/VL530l0X_ESP8266
      * https://www.maxbotix.com/Ultrasonic_Sensors/MB1000.htm
    * LIDAR (test OFX w/RPLidar)
  * Video live streaming VJ app
    * https://flussonic.com/post/html5-streaming
    * https://developer.mozilla.org/en-US/docs/Web/Guide/Audio_and_video_delivery/Live_streaming_web_audio_and_video
    * https://bitmovin.com/mpeg-dash-hls-examples-sample-streams/