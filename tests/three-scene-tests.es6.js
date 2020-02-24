/////////////////////////////////////////////
// DOM tests
/////////////////////////////////////////////

// header
mainEl.appendChild(DOMUtil.stringToDomElement("<h1>ThreeScene</h1>"));

// create log output element
insertHtmlStr(`<div id="three-scene" style="height: 400px;"></div>`);
let threeEl = document.getElementById('three-scene');

// demo class
class ThreeSceneDemo {

  constructor() {
    this.pointerPos = new PointerPos();
    this.setupScene();
    this.buildCube();
    this.addShadow();
    this.startAnimation();
  }

  setupScene() {
    this.threeScene = new ThreeScene(threeEl, 0xffffff);
    this.scene = this.threeScene.getScene();
    this.camera = this.threeScene.getCamera();
    this.frameCount = 0;
  }

  startAnimation() {
    this.animate();
    window.addEventListener('resize', () => this.resize());
  }

  buildCube() {
    let cubeSize = 100;
    var materialCube = new THREE.MeshPhongMaterial({
      color: 0x00ffbb,
      emissive : 0x000000,
      specular : 0x111111,
      shininess : 20,
      flatShading : false
    });

    this.cubeMesh = new THREE.Mesh(new THREE.BoxBufferGeometry(cubeSize * 0.4, cubeSize, cubeSize), materialCube);
    this.cubeMesh.castShadow = true;
    this.cubeMesh.position.set(0, 30, 0);
    this.scene.add(this.cubeMesh);
  }

  addShadow() {
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambientLight);
    var pointLight = new THREE.PointLight(0xffffff, 1, 0);
    pointLight.position.set(-100, 100, 0);
    this.scene.add(pointLight);

		// add shadow plane
    var planeSize = 1000;
		var plane = new THREE.Mesh(
			new THREE.PlaneBufferGeometry(planeSize, planeSize),
      new THREE.MeshLambertMaterial( { color: 0xffffff, emissive: 0x888888, side: THREE.DoubleSide })
		);
		plane.rotation.x = -Math.PI/2;
		plane.position.set(0, -110, 0);
		plane.receiveShadow = true;
		this.scene.add(plane);

    // add shadow spotlight
		this.spotlight = new THREE.SpotLight(0xffffff);
		this.spotlight.position.set(0, 600, 0);
		this.spotlight.target = plane;
		this.spotlight.castShadow = true;
		this.spotlight.shadow.mapSize.width = 4096;
		this.spotlight.shadow.mapSize.height = 4096;
    // this.spotlight.shadow.camera.near = 500;
    // this.spotlight.shadow.camera.far = 4000;
    // this.spotlight.shadow.camera.fov = 30;
		this.spotlight.penumbra = 0.1;
		this.spotlight.decay = 2;
		this.spotlight.angle = 1;
		this.spotlight.distance = 1000;
		this.scene.add(this.spotlight);

    // add light helper
		var spotlightDebug = false;
		if(spotlightDebug == true) {
			this.lightHelper = new THREE.SpotLightHelper( this.spotlight );
			this.scene.add(this.lightHelper);
		}
  }

  updateObjects() {
    // cube
    this.cubeMesh.rotation.y += 0.01;
    this.cubeMesh.rotation.x += 0.01;
    // lighthelper
    // if(this.lightHelper) this.lightHelper.update();
    // this.spotlight.position.y = this.pointerPos.y() * 10;
  }

  animate() {
    this.updateObjects();
    this.threeScene.render();
    this.frameCount++;
    requestAnimationFrame(() => this.animate());
  }

  resize() {
    this.threeScene.resize();
  }

}
new ThreeSceneDemo();

// break
insertHtmlStr('<hr/>');

/////////////////////////////////////////////
// Unit tests
/////////////////////////////////////////////
