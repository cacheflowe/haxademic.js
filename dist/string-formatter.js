'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var StringFormatter = function () {
  function StringFormatter() {
    _classCallCheck(this, StringFormatter);
  }

  _createClass(StringFormatter, null, [{
    key: 'formatPhone',


    /**
     *  Returns a standardized phone number string.
     *  @param  str An unformatted phone number.
     *  @return A standardized phone number string.
     *  @use    {@code var phone = StringFormatter.formatPhone('3035558888');}
     */
    value: function formatPhone(str) {
      return (str + '').replace(/[() -]*(?:\d?)[() -.]*(\d{3})[() -.]*(\d{3})[() -.]*(\d{4})[() -]*/, '($1) $2-$3');
    }
  }, {
    key: 'formatSSN',


    /**
     *  Returns a standardized social security number string.
     *  @param  str An unformatted social security number.
     *  @return A standardized social security number string.
     *  @use    {@code var ssn = StringFormatter.formatSSN('333002222');}
     */
    value: function formatSSN(str) {
      return (str + '').replace(/(\d{3})[ -]*(\d{2})[ -]*(\d{4})/, '$1-$2-$3');
    }
  }, {
    key: 'formatCreditCard',


    /**
     *  Returns a standardized credit card number string.
     *  @param  str An unformatted credit card number.
     *  @return A standardized credit card number string.
     *  @use    {@code var cc = StringFormatter.formatCreditCard('1111-2222-3333-4444');}
     */
    value: function formatCreditCard(str) {
      return (str + '').replace(/(\d{4})[ -]*(\d{4})[ -]*(\d{4})[ -]*(\d{4})/, '$1 $2 $3 $4');
    }
  }, {
    key: 'formatNumber',


    /**
     *  Returns a number, removing non-numeric characters.
     *  @param  str A number, without too much extra non-numeric junk in there.
     *  @return A number (in string format), stripped of non-numeric characters.
     *  @use    {@code var number = StringFormatter.formatNumber('$303.33');}
     */
    value: function formatNumber(str) {
      var float = str.match(/\d+\.?\d+/);
      if (float && float.length > 0) {
        return float[0];
      } else {
        return str;
      }
    }
  }, {
    key: 'formatDollarsCents',


    /**
     *  Returns a number with the traditional US currency format.
     *  @param  str A numberic monetary value.
     *  @return A number (in string format), with traditional US currency formatting.
     *  @use    {@code var moneyVal = StringFormatter.formatDollarsCents('303.333333');}
     */
    value: function formatDollarsCents(str) {
      var numParts;
      numParts = (str + '').split('.');
      if (numParts.length === 1) {
        numParts.push('00');
      } else {
        while (numParts[1].length < 2) {
          numParts[1] += '0';
        }
        numParts[1] = numParts[1].substr(0, 2);
      }
      return '$' + numParts.join('.');
    }
  }, {
    key: 'addCommasToNumber',


    /**
     *  Returns a string, formatted with commas in between every 3 numbers.
     *  @param  str A number.
     *  @return A formatted number (in string format).
     *  @use    {@code var formattedNumber = StringFormatter.addCommasToNumber('3000000');}
     */
    value: function addCommasToNumber(str) {
      var x = (str + '').split('.');
      var x1 = x[0];
      var x2 = x.length > 1 ? '.' + x[1] : '';
      var rgx = /(\d+)(\d{3})/;
      while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
      }
      return x1 + x2;
    }
  }, {
    key: 'timeFromSeconds',


    /**
     *  Returns a time as a string, with or without hours.
     *  @param  seconds   A number of seconds.
     *  @param  showHours Boolean flag for showing hours or not.
     *  @return A formatted time.
     *  @use    {@code var time = StringFormatter.timeFromSeconds(30000, true);}
     */
    value: function timeFromSeconds(seconds, showHours) {
      var h = Math.floor(seconds / 3600);
      var m = Math.floor(seconds % 3600 / 60);
      var s = Math.floor(seconds % 3600 % 60);
      var hStr = (h < 10 ? "0" : "") + h;
      var mStr = (m < 10 ? "0" : "") + m;
      var sStr = (s < 10 ? "0" : "") + s;
      if (showHours == true) {
        return hStr + ':' + mStr + ':' + sStr;
      } else {
        return mStr + ':' + sStr;
      }
    }
  }]);

  return StringFormatter;
}();
