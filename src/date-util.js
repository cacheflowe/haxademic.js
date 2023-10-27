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
}

DateUtil.midnightTimeSuffix = "T00:00:00Z";

export default DateUtil;
