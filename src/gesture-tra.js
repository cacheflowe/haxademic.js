import EasingFloat from "./easing-float.js";
import FloatBuffer from "./float-buffer.js";
import LinearFloat from "./linear-float.js";

class GestureTracker {
  constructor(bufferSize, switchFrames, activeThresh = 0.5) {
    this.inputBuffer = new FloatBuffer(bufferSize);
    this.doubleSmoothedAvg = new EasingFloat(0, 0.1);
    this.doubleSmoothedSumAbs = new EasingFloat(0, 0.1);
    this.switchIndex = new LinearFloat(0, switchFrames);
    if (!Array.isArray(activeThresh)) activeThresh = [activeThresh]; // allows passing a single threshold, but we'll convert to array
    this.thresholds = activeThresh;
    this.thresholdSwitches = this.thresholds.map((thresh) => {
      return new LinearFloat(0, switchFrames);
    });
    this.thresholdIndex = 0;
    this.bufferedActive = false;
  }

  update(newVal) {
    // update buffer
    this.inputBuffer.update(newVal);
    this.doubleSmoothedAvg.setTarget(this.inputBuffer.average()).update(true);
    this.doubleSmoothedSumAbs.setTarget(this.inputBuffer.sumAbs()).update(true);

    // check if activity is above threshold
    // handles multiple levels of thresholds!
    let switchIndexTarget = 0;
    this.thresholdSwitches.forEach((switchObj, i) => {
      let curThreshold = this.thresholds[i];
      let motionAboveThresh = this.inputBuffer.sumAbs() > curThreshold;
      switchObj.setTarget(motionAboveThresh ? 1 : 0);
      switchObj.update();
      // keep moving up the thresholds to find target index
      if (switchObj.value() == 1) {
        switchIndexTarget = i + 1;
      }
    });

    // update index switch and change buffered index when needed
    this.switchIndex.setTarget(switchIndexTarget);
    this.switchIndex.update();
    let isOnInteger = this.switchIndex.value() % 1 <= 0.000001; // stupid float precision - can't do `==`
    if (isOnInteger) {
      let curSwitchIndex = Math.round(this.switchIndex.value());
      if (this.thresholdIndex != curSwitchIndex) {
        this.thresholdIndex = curSwitchIndex;
      }
    }
  }

  smoothedAvg() {
    return this.doubleSmoothedAvg.value();
  }

  smoothedTotalMotion() {
    return this.doubleSmoothedSumAbs.value();
  }

  isActive() {
    return this.switchIndex.value() >= 1;
  }

  activeLevel() {
    return this.switchIndex.value();
  }

  activeLevelIndex() {
    return this.thresholdIndex;
  }

  toHtmlString() {
    let motionStatus = this.bufferedActive ? "Moving" : "Stopped";
    return `
      <div><code>this.inputBuffer.average()</code> = ${this.inputBuffer.average()}</div>
      <div><code>this.smoothedAvg()</code> = ${this.smoothedAvg()}</div>
      <div><code>this.inputBuffer.direction</code> = ${
        this.inputBuffer.average() > 0 ? "up" : "down"
      }</div>
      <div><code>this.inputBuffer.sumAbs()</code> = ${this.inputBuffer.sumAbs()}</div>
      <div><code>this.thresholds</code> = ${this.thresholds}</div>
      <div><code>this.smoothedTotalMotion()</code> = ${this.smoothedTotalMotion()}</div>
      <div><code>this.isActive()</code> = ${this.isActive()}</div>
      <div><code>this.thresholdSwitches()</code> = ${this.thresholdSwitches.map(
        (switchObj, i) => switchObj.value() > 0
      )}</div>
      <div><code>this.switchIndex.target()</code> = ${this.switchIndex.target()}</div>
      <div><code>this.activeLevel()</code> = ${this.activeLevel()}</div>
      <div><code>this.activeLevelIndex()</code> = ${this.activeLevelIndex()}</div>
      <div><code>motionStatus</code> = ${motionStatus}</div>
    `;
  }
}

export default GestureTracker;
