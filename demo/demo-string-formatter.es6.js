import DemoBase from "./demo--base.es6.js";
import StringFormatter from "../src/string-formatter.es6.js";
import * as zora from "../vendor/zora.mjs";

class StringFormatterDemo extends DemoBase {
  constructor(parentEl) {
    super(parentEl, [], "StringFormatter", "string-formatter");
  }

  init() {
    this.printTests();
    StringFormatterDemo.runUnitTests();
  }

  printTests() {
    this.el.innerHTML = `
      <div><code>StringFormatter.formatPhone('3035558888')</code> 
        ${StringFormatter.formatPhone("3035558888")}
      </div>
      <div><code>StringFormatter.formatSSN('333002222')</code> 
        ${StringFormatter.formatSSN("333002222")}
      </div>
      <div><code>StringFormatter.formatCreditCard('1111-2222-3333-4444')</code> 
        ${StringFormatter.formatCreditCard("1111-2222-3333-4444")}
      </div>
      <div><code>StringFormatter.formatNumber('$303.33')</code> 
        ${StringFormatter.formatNumber("$303.33")}
      </div>
      <div><code>StringFormatter.formatDollarsCents('303.333333')</code> 
        ${StringFormatter.formatDollarsCents("303.333333")}
      </div>
      <div><code>StringFormatter.addCommasToNumber('3000000')</code> 
        ${StringFormatter.addCommasToNumber("3000000")}
      </div>
      <div><code>StringFormatter.timeFromSeconds(30000, true)</code>
        ${StringFormatter.timeFromSeconds(30000, true)}
      </div>
      <div><code>StringFormatter.numberToFormattedString(30000.2102)</code> 
        ${StringFormatter.numberToFormattedString(30000.2102)}
      </div>
      <div><code>StringFormatter.numberToFormattedCurrency(30303.333333)</code> 
        ${StringFormatter.numberToFormattedCurrency(30303.333333)}
      </div>
      <div><code>StringFormatter.numberToCompactString(31333, true)</code> 
        ${StringFormatter.numberToCompactString(31333)}
      </div>
      <div><code>StringFormatter.numberToPercentString(0.1234, 2)</code> 
        ${StringFormatter.numberToPercentString(0.1234, 2)}
      </div>
    `;
  }

  static async runUnitTests() {
    await zora.test("StringFormatter.formatPhone", (test) => {
      test.ok(StringFormatter.formatPhone("3035558888"));
      test.equal(StringFormatter.formatPhone("3035558888"), "(303) 555-8888");
    });
    zora.test("StringFormatter.formatSSN", (test) => {
      test.ok(StringFormatter.formatSSN("333002222"));
      test.equal(StringFormatter.formatSSN("333002222"), "333-00-2222");
    });
    zora.test("StringFormatter.formatCreditCard", (test) => {
      test.ok(StringFormatter.formatCreditCard("1111-2222-3333-4444"));
      test.equal(
        StringFormatter.formatCreditCard("1111-2222-3333-4444"),
        "1111 2222 3333 4444"
      );
    });
    zora.test("StringFormatter.formatNumber", (test) => {
      test.ok(StringFormatter.formatNumber("$303.33"));
      test.equal(StringFormatter.formatNumber("$303.33"), "303.33");
    });
    zora.test("StringFormatter.formatDollarsCents", (test) => {
      test.ok(StringFormatter.formatDollarsCents("303.333333"));
      test.equal(StringFormatter.formatDollarsCents("303.333333"), "$303.33");
    });
    zora.test("StringFormatter.addCommasToNumber", (test) => {
      test.ok(StringFormatter.addCommasToNumber("3000000"));
      test.equal(StringFormatter.addCommasToNumber("3000000"), "3,000,000");
    });
    let result = await zora.test("StringFormatter.timeFromSeconds", (test) => {
      test.ok(StringFormatter.timeFromSeconds(30000, true));
      test.equal(StringFormatter.timeFromSeconds(30000, true), "08:20:00");
      console.log(test);
    });
    console.log(zora, result);
  }
}

if (window.autoInitDemo) window.demo = new StringFormatterDemo(document.body);
