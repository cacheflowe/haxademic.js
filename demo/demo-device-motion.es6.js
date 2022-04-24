import DemoBase from './demo--base.es6.js';
import EventLog from '../src/event-log.es6.js';
import FrameLoop from '../src/frame-loop.es6.js';

class DeviceMotionDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [], `
    <div class="container">
      <h1>DeviceMotion API</h1>
      <p>Mobile-only demo for accelerometer readings.</p>
      <button id="start-demo">Start Demo</button>
      <h4 style="margin-top:0.75rem;">Orientation</h4>
      <ul>
        <li>X-axis (&beta;): <span id="Orientation_b">0</span><span>&deg;</span></li>
        <li>Y-axis (&gamma;): <span id="Orientation_g">0</span><span>&deg;</span></li>
        <li>Z-axis (&alpha;): <span id="Orientation_a">0</span><span>&deg;</span></li>
      </ul>
      
      <h4>Accelerometer</h4>
      <ul>
        <li>X-axis: <span id="Accelerometer_x">0</span><span> m/s<sup>2</sup></span></li>
        <li>Y-axis: <span id="Accelerometer_y">0</span><span> m/s<sup>2</sup></span></li>
        <li>Z-axis: <span id="Accelerometer_z">0</span><span> m/s<sup>2</sup></span></li>
        <li>Data Interval: <span id="Accelerometer_i">0</span><span> ms</span></li>
      </ul>
      
      <h4>Accelerometer including gravity</h4>
      
      <ul>
        <li>X-axis: <span id="Accelerometer_gx">0</span><span> m/s<sup>2</sup></span></li>
        <li>Y-axis: <span id="Accelerometer_gy">0</span><span> m/s<sup>2</sup></span></li>
        <li>Z-axis: <span id="Accelerometer_gz">0</span><span> m/s<sup>2</sup></span></li>
      </ul>
      
      <h4>Gyroscope</h4>
      <ul>
        <li>X-axis: <span id="Gyroscope_x">0</span><span>&deg;/s</span></li>
        <li>Y-axis: <span id="Gyroscope_y">0</span><span>&deg;/s</span></li>
        <li>Z-axis: <span id="Gyroscope_z">0</span><span>&deg;/s</span></li>
      </ul>
    </div>
    `);
  }

  init() {
    this.log = new EventLog(this.debugEl);

    // https://sensor-js.xyz/demo.html
    function handleOrientation(event) {
      updateFieldIfNotNull('Orientation_a', event.alpha);
      updateFieldIfNotNull('Orientation_b', event.beta);
      updateFieldIfNotNull('Orientation_g', event.gamma);
    }
    
    function updateFieldIfNotNull(fieldName, value, precision=1){
      if (value != null)
        document.getElementById(fieldName).innerHTML = value.toFixed(precision);
    }
    
    function handleMotion(event) {
      updateFieldIfNotNull('Accelerometer_gx', event.accelerationIncludingGravity.x);
      updateFieldIfNotNull('Accelerometer_gy', event.accelerationIncludingGravity.y);
      updateFieldIfNotNull('Accelerometer_gz', event.accelerationIncludingGravity.z);
    
      updateFieldIfNotNull('Accelerometer_x', event.acceleration.x);
      updateFieldIfNotNull('Accelerometer_y', event.acceleration.y);
      updateFieldIfNotNull('Accelerometer_z', event.acceleration.z);
    
      updateFieldIfNotNull('Accelerometer_i', event.interval, 2);
    
      updateFieldIfNotNull('Gyroscope_z', event.rotationRate.alpha);
      updateFieldIfNotNull('Gyroscope_x', event.rotationRate.beta);
      updateFieldIfNotNull('Gyroscope_y', event.rotationRate.gamma);
    }
    
    let is_running = false;
    let demoStartButton = document.getElementById("start-demo");
    demoStartButton.onclick = function(e) {
      e.preventDefault();
      
      // Request permission for iOS 13+ devices
      if (DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === "function") {
        DeviceMotionEvent.requestPermission();
      }
      
      if (is_running){
        window.removeEventListener("devicemotion", handleMotion);
        window.removeEventListener("deviceorientation", handleOrientation);
        demoStartButton.innerHTML = "Start demo";
        demoStartButton.classList.add('btn-success');
        demoStartButton.classList.remove('btn-danger');
        is_running = false;
      }else{
        window.addEventListener("devicemotion", handleMotion);
        window.addEventListener("deviceorientation", handleOrientation);
        demoStartButton.innerHTML = "Stop demo";
        is_running = true;
      }
    };

    // animate loop
    window.frameLoop = new FrameLoop();
    window.frameLoop.addListener(this);
  }

  frameLoop(frameCount) {

  }

}

if(window.autoInitDemo) window.demo = new DeviceMotionDemo(document.body);
