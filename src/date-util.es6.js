class DateUtil {

  static getMillis() {
    return (new Date()).getTime();
  }

  static getDateTimeStamp() {
    const date = new Date();
    // return (date.getYear() + 1900) + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    return date.toISOString().slice(0, 10);
  }

  static getClockTimeStamp() {
    const date = new Date();
    return date.toTimeString().slice(0, 8).replace(/:/g, "-");
  }

  static getTimeStamp() {
    return DateUtil.getDateTimeStamp() + '-' + DateUtil.getClockTimeStamp();
  }

  static datesAreEqual(date1, date2) {
    return date1.getTime() == date2.getTime();
  }

}

DateUtil.midnightTimeSuffix = 'T00:00:00Z';

export default DateUtil;
