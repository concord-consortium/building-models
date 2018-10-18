/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const chai = require('chai');
chai.config.includeStack = true;

const { expect }         = chai;
const should         = chai.should();

const TimeUnits = require(`${__dirname}/../src/code/utils/time-units`);
const translate = require(`${__dirname}/../src/code/utils/translate`);

describe("TimeUnits", function() {
  it("should give singular and plural unit names", function() {
    TimeUnits.toString("SECOND").should.equal(translate("~TIME.SECOND"));
    return TimeUnits.toString("WEEK", true).should.equal(translate("~TIME.WEEK.PLURAL"));
  });

  return it("should work out the number of steps given a step size and period", function() {
    TimeUnits.stepsInTime(1,  "DAY", 2, "WEEK").should.equal(14);
    TimeUnits.stepsInTime(10, "DAY", 1, "YEAR").should.equal(36);
    return TimeUnits.stepsInTime(1,  "DAY", 1, "SECOND").should.equal(0);
  });
});
