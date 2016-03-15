TimeUnits = require '../../utils/time-units'

migration =
  version: "1.7.0"
  description: "Adds Simulation settings"
  date: "2015-10-02"

  doUpdate: (data) ->
    data.settings ?= {}
    data.settings.simulation ?= {}
    data.settings.simulation.period ?= 10
    data.settings.simulation.stepSize ?= 1
    data.settings.simulation.periodUnits = TimeUnits.defaultUnit
    data.settings.simulation.stepUnits = TimeUnits.defaultUnit

module.exports = _.mixin migration, require './migration-mixin'
