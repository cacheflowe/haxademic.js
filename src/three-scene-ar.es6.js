class ThreeSceneAr extends ThreeScene {

  // TODO:
  // - Extend THREEx.ArSmoothedControls controls to lerp scale down to hide
  // - Add a way to show a link to the jpg marker file for testing/printing
  // - Instructions if someone declines camera permission
  //   - Instructions behind camera permission popup?
  // - [Nice-to-have] Whats up with the aspect ratio bug?? Only does it on static test
  //   - Source image processing gets stretched in portrait?! If debug is turned on, you can see it happen

  constructor(el=document.body, arJsOptions, debug=false) {
    super(el, 0x000000, true);
    // store props
    this.cameraSource = arJsOptions.cameraSource;
    this.arCameraData = arJsOptions.arCameraData;
    this.arMarkerPatt = arJsOptions.arMarkerPatt;
    this.sourceReadyCallback = arJsOptions.sourceReadyCallback || null;
    this.sourceErrorCallback = arJsOptions.sourceErrorCallback || null;
    this.markerActiveCallback = arJsOptions.markerActiveCallback || null;
    this.lighting = arJsOptions.lighting || {};
    this.debug = debug;
    // set state
    this.active = false;

    // add ar.js on top of ThreeScene
    this.buildArCameraSource();
    this.buildArCV();
    this.buildMarkerConfig();
    this.buildSmoothedArControls();

    // add shadow & lighting
    this.buildShadowPlane();
    this.buildLights();
    if(this.debug) this.addTestCube();
  }

  buildArCameraSource() {
    // set ARcamera source - either webcam or URL to static test image
    let sourceOptions = (this.cameraSource == ThreeSceneAr.WEBCAM) ?
      {sourceType : 'webcam'} :
      {sourceType : 'image', sourceUrl: this.cameraSource};
    this.arToolkitSource = new THREEx.ArToolkitSource(sourceOptions);

    // init source listener
    this.arToolkitSource.init(
      () => this.cameraSourceReady(), 
      (e) => this.cameraSourceError(e)
    );
  }

  cameraSourceReady() {
    if(this.debug) console.log("AR.js ready");
    this.resize();
    setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 200);
    if(this.sourceReadyCallback) this.sourceReadyCallback();
  }

  cameraSourceError() {
    if(this.debug) console.log("AR.js source access denied");
    if(this.sourceErrorCallback) this.sourceErrorCallback();
  }

  buildArCV() {
    // configure ARToolkit & image analysis params
    this.arToolkitContext = new THREEx.ArToolkitContext({
      debug: this.debug,
      cameraParametersUrl: this.arCameraData,
      detectionMode: 'mono',
      maxDetectionRate: 30,   // max fps of CV updates
      // canvasWidth: 80*3,		// scaleing down makes analysis faster, but also worse at marker detection
      // canvasHeight: 60*3,
    });

    // Call init & copy projection matrix to camera when complete
    this.arToolkitContext.init(() => {
      this.camera.projectionMatrix.copy( this.arToolkitContext.getProjectionMatrix() );
    });
  }

  buildMarkerConfig() {
    // Add marker container.
    // Don't add to actual scene, because we're using a smoothed controls container that will lerp towards `markerRoot`
    this.markerRoot = new THREE.Group();
    this.markerControls1 = new THREEx.ArMarkerControls(this.arToolkitContext, this.markerRoot, {
      type : 'pattern',
      patternUrl : this.arMarkerPatt,
    });
    // this.scene.add(this.markerRoot);
  }

  buildSmoothedArControls() {
    // interpolates from last position to create smoother transitions when moving.
    // parameter lerp values near 0 are slow, near 1 are fast (instantaneous).
    this.arRoot = new THREE.Group();
    this.scene.add(this.arRoot);
    this.arSmoothControls = new THREEx.ArSmoothedControls(this.arRoot, {
      lerpPosition: 0.3,
      lerpQuaternion: 0.3,
      lerpScale: 0.3,
      minVisibleDelay: 0.2,
      minUnvisibleDelay: 0.5,
    });
    this.arSmoothControls.addEventListener('becameVisible', () => {
      this.active = true;
      if(this.markerActiveCallback) this.markerActiveCallback(this.active);
      if(this.debug) console.log('becameVisible event notified')
    })
    this.arSmoothControls.addEventListener('becameUnVisible', () => {
      this.active = false;
      if(this.markerActiveCallback) this.markerActiveCallback(this.active);
      if(this.debug) console.log('becameUnVisible event notified')
    })
  }

  buildScene() {
    // override ThreeScene parent camera configuration
    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();
    this.scene.add(this.camera);
  }

  buildLights() {
    // ambient light
    const ambientColor = (this.lighting.ambientColor) ? this.lighting.ambientColor : 0xcccccc;
    const ambientIntensity = (this.lighting.ambientIntensity) ? this.lighting.ambientIntensity : 0.65;
    let ambientLight = new THREE.AmbientLight(ambientColor, ambientIntensity);
    this.scene.add(ambientLight);

    // hemisphere light
    const lightHemiSkyColor = (this.lighting.lightHemiSkyColor) ? this.lighting.lightHemiSkyColor : 0x999999;
    const lightHemiGroundColor = (this.lighting.lightHemiGroundColor) ? this.lighting.lightHemiGroundColor : 0xffffff;
    const lightHemiIntensity = (this.lighting.lightHemiIntensity) ? this.lighting.lightHemiIntensity : 0.65;
    this.lightHemisphere = new THREE.HemisphereLight(lightHemiSkyColor, lightHemiGroundColor, lightHemiIntensity);
    this.scene.add(this.lightHemisphere);

    // directional light
    const lightDirectionalColor = (this.lighting.lightDirectionalColor) ? this.lighting.lightDirectionalColor : 0xffffff;
    const lightDirectionalIntensity = (this.lighting.lightDirectionalIntensity) ? this.lighting.lightDirectionalIntensity : 0.5;
    const lightDirectionalX = (this.lighting.lightDirectionalX) ? this.lighting.lightDirectionalX : 2;
    const lightDirectionalY = (this.lighting.lightDirectionalY) ? this.lighting.lightDirectionalY : 3;
    const lightDirectionalZ = (this.lighting.lightDirectionalZ) ? this.lighting.lightDirectionalZ : 1;
    this.lightDirectional = new THREE.DirectionalLight(lightDirectionalColor, lightDirectionalIntensity);
    this.lightDirectional.position.set(lightDirectionalX, lightDirectionalY, lightDirectionalZ);
    this.scene.add(this.lightDirectional);
  }

  buildShadowPlane() {
    // add shadow plane
    const shadowPlaneSize = (this.lighting.shadowPlaneSize) ? this.lighting.shadowPlaneSize : 15; // 1 is the size of the AR marker
    const shadowOpacity = (this.lighting.shadowOpacity) ? this.lighting.shadowOpacity : 0.5;
    this.shadowPlane = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(shadowPlaneSize, shadowPlaneSize),
      new THREE.ShadowMaterial({ opacity: shadowOpacity })
    );
    this.shadowPlane.rotation.x = -Math.PI/2;
    this.shadowPlane.receiveShadow = true;
    this.shadowPlane.depthWrite = false;
    this.shadowPlane.position.set(0, -0.05, 0); // set the shadow plane just under the model to prevent z-clipping
    this.arRoot.add(this.shadowPlane);

    // add shadow spotlight
    const shadowLightX = (this.lighting.shadowLightX) ? this.lighting.shadowLightX : 1;
    const shadowLightY = (this.lighting.shadowLightY) ? this.lighting.shadowLightY : 6;
    const shadowLightZ = (this.lighting.shadowLightZ) ? this.lighting.shadowLightZ : 0;
    const shadowSpotlightAngle = (this.lighting.shadowSpotlightAngle) ? this.lighting.shadowSpotlightAngle : 0.5;
    const shadowMapSize = (this.lighting.shadowMapSize) ? this.lighting.shadowMapSize : 1024;
    this.spotlight = new THREE.SpotLight(0xffffff);
    this.spotlight.position.set(shadowLightX, shadowLightY, shadowLightZ);   // light is above and just off to a side
    this.spotlight.target = this.shadowPlane;
    this.spotlight.castShadow = true;
    this.spotlight.shadow.mapSize.width = shadowMapSize;
    this.spotlight.shadow.mapSize.height = shadowMapSize;
    // this.spotlight.shadow.camera.near = 500;
    // this.spotlight.shadow.camera.far = 4000;
    // this.spotlight.shadow.camera.fov = 30;
    // this.spotlight.shadow.radius = 80;
    this.spotlight.penumbra = 0.01;
    this.spotlight.decay = 1;
    this.spotlight.angle = shadowSpotlightAngle;
    this.spotlight.distance = shadowLightY + 1;
    this.arRoot.add(this.spotlight);

    // add light helper
    var spotlightDebug = false;
    if(spotlightDebug == true) {
      var lightHelper = new THREE.SpotLightHelper( this.spotlight );
      this.arRoot.add(this.lightHelper);
    }
  }

  getScene() {
    return this.scene;
  }

  getArRoot() {
    return this.arRoot;
  }

  render() {
    // update smoothed AR controls
    this.arSmoothControls.update(this.markerRoot);

    // update artoolkit on every frame
    if(this.arToolkitSource.ready !== false ) {
      this.arToolkitContext.update( this.arToolkitSource.domElement );
    }

    // three.js render step
    super.render();
  }

  resize() {
    // don't call super, but make sure we're fit to the html container
    this.fitToHtmlContainer();
    // update AR.js
    this.arToolkitSource.onResizeElement();
    this.arToolkitSource.copyElementSizeTo(this.renderer.domElement);
    if( this.arToolkitContext.arController !== null ) {
      this.arToolkitSource.copyElementSizeTo(this.arToolkitContext.arController.canvas);
    }
  }

  addTestCube() {
    // add a transparent unit cube so we can tell if things are working
    let cubeMesh = new THREE.Mesh(
      new THREE.CubeGeometry(1, 1, 1),
      new THREE.MeshNormalMaterial({ transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    );
    cubeMesh.position.y = 0.5;
    this.arRoot.add(cubeMesh);
  }

}

ThreeSceneAr.WEBCAM = "webcam";
