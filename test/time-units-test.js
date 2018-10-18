chai = require('chai')
chai.config.includeStack = true

expect         = chai.expect
should         = chai.should()

TimeUnits = require "#{__dirname}/../src/code/utils/time-units"
translate = require "#{__dirname}/../src/code/utils/translate"

describe "TimeUnits", ->
  it "should give singular and plural unit names", ->
    TimeUnits.toString("SECOND").should.equal translate("~TIME.SECOND")
    TimeUnits.toString("WEEK", true).should.equal translate("~TIME.WEEK.PLURAL")

  it "should work out the number of steps given a step size and period", ->
    TimeUnits.stepsInTime(1,  "DAY", 2, "WEEK").should.equal 14
    TimeUnits.stepsInTime(10, "DAY", 1, "YEAR").should.equal 36
    TimeUnits.stepsInTime(1,  "DAY", 1, "SECOND").should.equal 0
