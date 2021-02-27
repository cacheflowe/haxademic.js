# Haxademic.js

A personal front-end JavaScript toolkit

## Demo / Tests

[Demos](https://cacheflowe.github.io/haxademic.js/)

## TODO

* If using full screen bg css, add MobileUtil fillscreen helper to properly set container size
  * Also, check this for iOS `vh`: https://developer.mozilla.org/en-US/docs/Web/API/Visual_Viewport_API
* Update es6 module versions of
  * AR.js: https://skarredghost.com/2019/08/29/how-to-seamless-mobile-ar-js/
  * Switch to dat.gui. whoops
    * https://github.com/dataarts/dat.gui/blob/master/API.md
    * MIDI learn - work into dat.gui refactor from old gui library
  * Add new page.js & demo
    * https://github.com/visionmedia/page.js/blob/master/page.mjs
  * Zora
* Convert more old haxademic.js demos
* Begin integrating html-experiments repo?
* Add utility methods: https://1loc.dev/
* Integrate with SimpleSite & new es6 build system
  * Copy Me+You static site + gulp starter & replace StaticSite
* Assimilate & remove:
  * [Done? added to PointerPos] did-drag repos
  * imagexpander
  * cacheflowe.com music player!
    * make inline version in addition to global player
* Someday convert class constants to static fields: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Class_fields#Browser_compatibility
* Bring in Howler.js & Tone.js & wavesurfer.js
* Distributed surround audio

## To Investigate

* New html features
  * ResizeObserver: https://webkit.org/blog/9997/resizeobserver-in-webkit/
  * MediaRecorder: https://mozdevs.github.io/MediaRecorder-examples/
* es6 modules
  * https://v8.dev/features/modules
  * https://ccoenraets.github.io/es6-tutorial/classes/
* THREE.js
  * RenderTargets
    * https://tympanus.net/codrops/2020/06/02/kinetic-typography-with-three-js/
    * https://leclub.github.io/2016/06/ThreeJS-Gray-Scott-Reaction-Diffusion/
    * https://codepen.io/haangglide/pen/YzqmZwz?editors=1010
    * https://github.com/TimvanScherpenzeel/Thesis/blob/master/scripts/gpgpu.js
  * Lines
    * https://threejs.org/examples/webgl_buffergeometry_lines.html
    * https://jsfiddle.net/Ldynhxkq/
      * Updated w/shader: https://jsfiddle.net/f5kae7yr/
    * https://threejs.org/examples/#webgl_lines_sphere
  * Particles
    * https://medium.com/@joshmarinacci/particles-go-wild-with-textures-8b81fdd93ba2
    * https://vr.josh.earth/webxr-experiments/boilerplate/pointer.js
    * https://tympanus.net/codrops/2019/01/17/interactive-particles-with-three-js/
    * http://barradeau.com/blog/?p=621
    * https://github.com/squarefeet/ShaderParticleEngine
    * http://www.iamnop.com/particles/
      * https://github.com/nopjia/particles
    * http://www.iamnop.com/particles-mrt/
      * https://github.com/nopjia/particles-mrt
    * http://minimal.be/lab/fluGL/index80000.html
    * https://codepen.io/zadvorsky/pen/MaVXPQ
      * https://github.com/zadvorsky/three.bas
    * https://www.html5rocks.com/en/tutorials/webgl/million_letters/
    * https://soledadpenades.com/articles/three-js-tutorials/rendering-snow-with-shaders/
    * https://tympanus.net/codrops/2019/10/01/simulating-depth-of-field-with-particles-using-the-blurry-library/
    * https://codepen.io/SarahC/pen/XWbmePd
    * https://threejs.org/examples/#webgl_interactive_raycasting_points - interactive points
    * https://threejs.org/examples/webgl_postprocessing_dof.html
    * https://threejs.org/examples/webgl_postprocessing_dof2.html
    * https://threejs.org/examples/#webgl_instancing_performance
    * https://threejs.org/examples/#webgl_points_billboards
    * https://threejs.org/examples/#webgl_points_sprites
    * https://threejs.org/examples/#webgl_buffergeometry_glbufferattribute
    * https://threejs.org/examples/#webgl_buffergeometry_custom_attributes_particles
      * https://stackoverflow.com/questions/35328937/how-to-tween-10-000-particles-in-three-js/35373349#35373349
    * https://threejs.org/examples/#webgl_buffergeometry
    * https://threejs.org/examples/#webgl_buffergeometry_instancing
    * https://threejs.org/examples/#webgl_buffergeometry_instancing_billboards **(!!!)**
    * https://threejs.org/examples/#webgl_buffergeometry_points
    * https://threejs.org/examples/#webgl_buffergeometry_points_interleaved
    * https://threejs.org/examples/#webgl_buffergeometry_uint
    * https://threejs.org/examples/#webgl_custom_attributes_points
    * https://threejs.org/examples/#webgl_custom_attributes_points2
    * https://threejs.org/examples/#webgl_custom_attributes_points3
    * https://stemkoski.github.io/Three.js/ParticleSystem-Dynamic.html
    * https://stemkoski.github.io/Three.js/ParticleSystem-Shader.html
    * https://2pha.com/blog/experimenting-threejs-shaders-and-shadermaterial/

## Done

* Rollup
  * Build tools
    * https://rollupjs.org/guide/en/
      * https://www.npmjs.com/package/@rollup/stream
      * https://www.sitepoint.com/rollup-javascript-bundler-introduction/
      * Look at these rollup configs: 
        * https://github.com/gnikoloff/webgl2-2d-metaballs
        * https://github.com/pschroen/alien.js
    * https://github.com/terser/terser
