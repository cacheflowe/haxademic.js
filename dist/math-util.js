"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MathUtil = function () {
  function MathUtil() {
    _classCallCheck(this, MathUtil);
  }

  _createClass(MathUtil, null, [{
    key: "randRange",


    /**
     *  Calculates a random number within a minimum and maximum range.
     *  @param  min the value for the bottom range.
     *  @param  max the value for the upper range.
     *  @return the random number within the range.
     *  @use    {@code let vRandRange = MathUtil.randRange( 0, 999999 );}
     */
    value: function randRange(min, max) {
      return Math.round(Math.random() * (max - min)) + min;
    }

    /**
     *  Calculates a random number within a minimum and maximum range.
     *  @param  min   the value for the bottom range.
     *  @param  max   the value for the upper range.
     *  @return the random number within the range.
     *  @use    {@code let vRandRange = MathUtil.randRange( 0, 999999 );}
     */

  }, {
    key: "randRangeDecimel",
    value: function randRangeDecimel(min, max) {
      return Math.random() * (max - min) + min;
    }
  }, {
    key: "randBoolean",
    value: function randBoolean() {
      return Math.random() > 0.5 ? true : false;
    }
  }, {
    key: "randBooleanWeighted",
    value: function randBooleanWeighted(likeliness) {
      return Math.random() < likeliness ? true : false;
    }

    /**
     *  Returns a percentage of a value in between 2 other numbers.
     *  @param  bottomRange   low end of the range.
     *  @param  topRange      top end of the range.
     *  @param  valueInRange  value to find a range percentage of.
     *  @return The percentage [0-1] of valueInRange in the range.
     *  @use    {@code let vPercent = MathUtil.getPercentWithinRange( 50, 150, 100 );  // displays 50 }
     */

  }, {
    key: "getPercentWithinRange",
    value: function getPercentWithinRange(bottomRange, topRange, valueInRange) {
      // normalize values to work positively from zero
      topRange += -bottomRange;
      valueInRange += -bottomRange;
      bottomRange += -bottomRange; // last to not break other offsets
      // return percentage or normalized values
      return valueInRange / (topRange - bottomRange);
    }
  }, {
    key: "lerp",
    value: function lerp(val1, val2, percent) {
      // 0.5 percent is an even mix
      return val1 + (val2 - val1) * percent;
    }
  }, {
    key: "map",
    value: function map(val, inputMin, inputMax, outputMin, outputMax) {
      return (outputMax - outputMin) * ((val - inputMin) / (inputMax - inputMin)) + outputMin;
    }

    /**
     *  Returns a percentage of a value in between 2 other numbers.
     *  @param  inputNum   The number to round.
     *  @param  numPoints  Number of decimal points to round to.
     *  @return The rounded number.
     *  @use    {@code let roundedNum = MathUtil.roundToDecimal( 10.3333, 1 );  // displays 10.3 }
     */

  }, {
    key: "roundToDecimal",
    value: function roundToDecimal(inputNum, numPoints) {
      var multiplier = Math.pow(10, numPoints);
      return Math.round(inputNum * multiplier) / multiplier;
    }

    /**
     *  Ease a number towards a target.
     *  @param  current     number (0)
     *  @param  target      number (100)
     *  @param  easeFactor  number (2)
     *  @return number 50
     *  @use    {@code let vRadians = MathUtil.easeTo( 0, 100, 2 );}
     */

  }, {
    key: "easeTo",
    value: function easeTo(current, target, easeFactor) {
      return current -= (current - target) / easeFactor;
    }

    /**
     *  Convert a number from Degrees to Radians.
     *  @param  d degrees (45°, 90°)
     *  @return radians (3.14..., 1.57...)
     *  @use    {@code let vRadians = MathUtil.degreesToRadians( 180 );}
     */

  }, {
    key: "degreesToRadians",
    value: function degreesToRadians(d) {
      return d * (Math.PI / 180);
    }

    /**
     *  Convert a number from Radians to Degrees.
     *  @param  r radians (3.14..., 1.57...)
     *  @return degrees (45°, 90°)
     *  @use    {@code let vDegrees = MathUtil.radiansToDegrees( 3.14 );}
     */

  }, {
    key: "radiansToDegrees",
    value: function radiansToDegrees(r) {
      return r * (180 / Math.PI);
    }

    /**
     *  Convert a number from a Percentage to Degrees (based on 360°).
     *  @param  n percentage (1, .5)
     *  @return degrees (360°, 180°)
     *  @use    {@code let vDegreesPercent = MathUtil.percentToDegrees( 50 );}
     */

  }, {
    key: "percentToDegrees",
    value: function percentToDegrees(n) {
      return Math.abs(n) * 360;
    }

    /**
     *  Convert a number from Degrees to a Percentage (based on 360°).
     *  @param  n degrees (360°, 180°)
     *  @return percentage (1, .5)
     *  @use    {@code let vPercentDegrees = MathUtil.degreesToPercent( 180 );}
     */

  }, {
    key: "degreesToPercent",
    value: function degreesToPercent(n) {
      return Math.abs(n / 360);
    }
  }, {
    key: "saw",
    value: function saw(rads) {
      var val = Math.abs(rads % (Math.PI * 2) - Math.PI);
      return val / Math.PI * 2 - 1;
    }

    /**
     *  Rips through an indexed array of numbers adding the total of all values.
     *  @param  nums  an array of numbers.
     *  @return the sum of all numbers.
     *  @use    {@code let vSums = MathUtil.sums( [ 12, 20, 7 ] );}
     */

  }, {
    key: "sums",
    value: function sums(nums) {
      // declare locals.
      var sum = 0;
      var numL = nums.length;

      // loop: convert and add.
      for (var i = 0; i < numL; i++) {
        sum += nums[i];
      }
      return sum;
    }

    /**
     *  Report the average of an array of numbers.
     *  @param  nums  an array of numbers.
     *  @return the average of all numbers.
     *  @use    {@code let vAverage = MathUtil.average( [ 12, 20, 7 ] );}
     */

  }, {
    key: "average",
    value: function average(nums) {
      return MathUtil.sums(nums) / nums.length;
    }

    /**
     *  Linear interpolate between two values.
     *  @param  lower first value (-1.0, 43.6)
     *  @param  upper second value (-100.0, 3.1415)
     *  @param  n     point between values (0.0, 1.0)
     *  @return number (12.3, 44.555)
     *  @use    {@code let value = MathUtil.interp( 10, 20, .5 );  //returns 15}
     */

  }, {
    key: "interp",
    value: function interp(lower, upper, n) {
      return (upper - lower) * n + lower;
    }

    /**
     *  Re-maps a number from one range to another.
     *  @param  value  The incoming value to be converted
     *  @param  lower1 Lower bound of the value's current range
     *  @param  upper1 Upper bound of the value's current range
     *  @param  lower2 Lower bound of the value's target range
     *  @param  upper2 Upper bound of the value's target range
     *  @return number (12.3, 44.555)
     *  @use    {@code let value = MathUtil.remap( 10, 0, 20, 1, 2 );  //returns 1.5}
     */

  }, {
    key: "remap",
    value: function remap(value, lower1, upper1, lower2, upper2) {
      return MathUtil.interp(lower2, upper2, MathUtil.getPercentWithinRange(lower1, upper1, value));
    }

    /**
     *  Get distance between 2 points with the pythagorean theorem.
     *  @param  x1  first point's x position
     *  @param  y1  first point's y position
     *  @param  x2  second point's x position
     *  @param  y2  second point's y position
     *  @return The distance between point 1 and 2
     *  @use    {@code let distance = MathUtil.getDistance( 7, 5, 3, 2 );}
     */

  }, {
    key: "getDistance",
    value: function getDistance(x1, y1, x2, y2) {
      var a = x1 - x2;
      var b = y1 - y2;
      return Math.abs(Math.sqrt(a * a + b * b));
    }
  }, {
    key: "smoothstep",
    value: function smoothstep(edge0, edge1, x) {
      x = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
      return x * x * (3 - 2 * x);
    }

    /**
     *  Keep a value between a min & max.
     *  @param  val  The value to clamp
     *  @param  min  The minimum value
     *  @param  max  The maximum value
     *  @return The clamped value
     *  @use    {@code let singleDigit = MathUtil.getDistance( value, 0, 9 );}
     */

  }, {
    key: "clamp",
    value: function clamp(val, min, max) {
      return Math.max(min, Math.min(max, val));
    }

    /**
     *  Keep an angle between 0-360
     *  @param  angle the angle to constrain
     *  @return The normalized angle
     *  @use    {@code let angle = MathUtil.constrainAngle( 540 );}
     */

  }, {
    key: "constrainAngle",
    value: function constrainAngle(angle) {
      if (angle < 0) return angle + 360;
      if (angle > 360) return angle - 360;
      return angle;
    }

    /**
     *  Keep an angle between 0-360
     *  @param  angle the angle to constrain
     *  @return The normalized angle
     *  @use    {@code let angle = MathUtil.constrainAngle( 540 );}
     */

  }, {
    key: "constrainRadians",
    value: function constrainRadians(radians) {
      if (radians < 0) return radians + Math.PI * 2;
      if (radians > Math.PI * 2) return radians - Math.PI * 2;
      return radians;
    }

    /**
     *  Get the angle fron current coordinate to target coordinate
     *  @param  x1  first point's x position
     *  @param  y1  first point's y position
     *  @param  x2  second point's x position
     *  @param  y2  second point's y position
     *  @return The angle from point 1 and 2
     *  @use    {@code let angle = MathUtil.getAngleToTarget( 0, 0, 5, 5 );}
     */

  }, {
    key: "getAngleToTarget",
    value: function getAngleToTarget(x1, y1, x2, y2) {
      return MathUtil.constrainAngle(-Math.atan2(x1 - x2, y1 - y2) * 180 / Math.PI);
    }

    /**
     *  Get the radians fron current coordinate to target coordinate
     *  @param  x1  first point's x position
     *  @param  y1  first point's y position
     *  @param  x2  second point's x position
     *  @param  y2  second point's y position
     *  @return The radians from point 1 and 2
     *  @use    {@code let angle = MathUtil.getRadiansToTarget( 0, 0, 5, 5 );}
     */

  }, {
    key: "getRadiansToTarget",
    value: function getRadiansToTarget(x1, y1, x2, y2) {
      var twoPi = Math.PI * 2;
      return (twoPi + -Math.PI / 2 + Math.atan2(x2 - x1, y2 - y1)) % twoPi;
    }

    /**
     *  Figures out which way to rotate for the shortest path from current to target angle
     *  @param  curAngle    starting angle
     *  @param  targetAngle destination angle
     *  @return +1 fo clockwise, -1 for counter-clockwise
     *  @use    {@code let direction = MathUtil.rotationDirectionToTarget( 90, 180 );}
     */

  }, {
    key: "getRotationDirectionToTarget",
    value: function getRotationDirectionToTarget(curAngle, targetAngle) {
      // calculate the difference between the current angle and destination angle
      var angleDifference = Math.abs(curAngle - targetAngle);
      // turn left or right to get to the target
      if (curAngle > targetAngle) {
        return angleDifference < 180 ? -1 : 1;
      } else {
        return angleDifference < 180 ? 1 : -1;
      }
    }
  }, {
    key: "circleRadiusToEnclosingSquareCorner",
    value: function circleRadiusToEnclosingSquareCorner(squareSize) {
      return squareSize / 2 * (Math.sqrt(2) - 1);
    }
  }, {
    key: "saw",
    value: function saw(rads) {
      var val = Math.abs(rads % (Math.PI * 2) - Math.PI);
      return val / Math.PI * 2 - 1;
    }
  }]);

  return MathUtil;
}();

MathUtil.TWO_PI = Math.PI * 2;

/*
Main.prototype = {
// from: http://codepen.io/RobertMulders/pen/gPYqaR
  init: function() {
    waves.push(new WaveForm(
      'sawtooth',
      i => i % maxValue
    ));

    waves.push(new WaveForm(
      'square',
      i => (i % maxValue * 2 < maxValue) ? maxValue : 0
    ));

    waves.push(new WaveForm(
      'triangle',
      i => Math.abs((i % (maxValue * 2)) - maxValue)
    ));

    waves.push(new WaveForm(
      'sine',
      i => maxValue / 2 * Math.sin(i / 25) + maxValue / 2
    ));

*/
