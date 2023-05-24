import StringFormatter from "./string-formatter.es6";

export default class Stopwatch {
  constructor() {
    this.totalMs = 0;
    this.startTime = 0;
    this.isTiming = false;
  }

  curTime() {
    return new Date().getTime();
  }

  reset() {
    this.totalMs = 0;
    this.startTime = this.curTime();
    return this;
  }

  start() {
    if (this.isTiming) return;
    this.isTiming = true;
    this.startTime = this.curTime();
    console.log("startTime", this.startTime);
    return this;
  }

  stop() {
    if (!this.isTiming) return this.totalMs;
    this.isTiming = false;
    this.totalMs += this.curTime() - this.startTime;
    return this.totalMs;
  }

  isRunning() {
    return this.isTiming;
  }

  totalCurMs() {
    if (this.isTiming) {
      return this.totalMs + this.curTime() - this.startTime;
    } else {
      return this.totalMs;
    }
  }

  curSeconds() {
    return this.totalCurMs() / 1000;
  }

  totalMinutes() {
    return StringFormatter.timeFromSeconds(this.curSeconds(), false, false);
  }

  totalHours() {
    return StringFormatter.timeFromSeconds(this.curSeconds(), true, false);
  }
}
