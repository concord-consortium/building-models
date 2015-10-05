chai = require('chai')
chai.config.includeStack = true

expect         = chai.expect
should         = chai.should()

SimulationStore = require "#{__dirname}/../../src/code/stores/simulation-store"
TimeUnits = require "#{__dirname}/../../src/code/utils/time-units"
SimStore = SimulationStore.store

namedUnit = (name) ->
  _.find TimeUnits.units, (n) -> n is name

describe "SimulationStore", ->
  describe "_setUnitsNames", ->
    describe "With plural units", ->
      beforeEach ->
        SimStore.settings =
          period: 10
          periodUnits: namedUnit "YEAR"
          stepSize: 2
          stepUnits: namedUnit "SECOND"
        SimStore._setUnitsNames()

      it "should pluralize unit names", ->
        SimStore.settings.periodUnitsName.should.equal "Years"
        SimStore.settings.stepUnitsName.should.equal "Seconds"

    describe "With singular units", ->
      beforeEach ->
        SimStore.settings =
          period: 1
          periodUnits: namedUnit "YEAR"
          stepSize: 1
          stepUnits: namedUnit "SECOND"
        SimStore._setUnitsNames()

      it "should pluralize unit names", ->
        SimStore.settings.periodUnitsName.should.equal "Year"
        SimStore.settings.stepUnitsName.should.equal "Second"
