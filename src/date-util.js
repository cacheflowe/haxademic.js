class DateUtil {
  static getMillis() {
    return new Date().getTime();
  }

  static getMillisFine() {
    return performance.now();
  }

  static getDateTimeStamp() {
    const date = new Date();
    return date.toISOString().slice(0, 10);
  }

  static getClockTimeStamp() {
    const date = new Date();
    return date.toTimeString().slice(0, 8).replace(/:/g, "-");
  }

  static getTimeStamp() {
    return DateUtil.getDateTimeStamp() + "-" + DateUtil.getClockTimeStamp();
  }

  static getTimeStamp2() {
    return new Date()
      .toISOString()
      .slice(0, 19)
      .replace("T", "_")
      .replaceAll(":", "-");
  }

  static datesAreEqual(date1, date2) {
    return date1.getTime() == date2.getTime();
  }

  static formattedTime(seconds, showHours = true) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);

    const hStr = h.toString().padStart(2, "0");
    const mStr = m.toString().padStart(2, "0");
    const sStr = s.toString().padStart(2, "0");
    const msStr = ms.toString().padStart(2, "0");

    return `${showHours ? `${hStr}:` : ""}${mStr}:${sStr}`;
  }
}

DateUtil.midnightTimeSuffix = "T00:00:00Z";

export default DateUtil;
