class DateUtilDemo extends DemoBase {

  constructor(parentEl) {
    super(parentEl, [
      "../src/date-util.es6.js",
    ], 'DateUtil', 'date-util-container');
  }

  init() {
    this.el = document.getElementById('date-util-container');
    this.el.innerHTML = `
      <div><code>getMillis</code> = ${DateUtil.getMillis()}</div>
      <div><code>getDateTimeStamp</code> = ${DateUtil.getDateTimeStamp()}</div>
      <div><code>getClockTimeStamp</code> = ${DateUtil.getClockTimeStamp()}</div>
      <div><code>getTimeStamp</code> = ${DateUtil.getTimeStamp()}</div>
    `;
  }

}

if(window.autoInitDemo) new DateUtilDemo(document.body);
