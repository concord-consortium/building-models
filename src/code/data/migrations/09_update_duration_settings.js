migration =
  version: "1.8.0"
  description: "Updates duration settings"
  date: "2015-10-14"

  doUpdate: (data) ->
    data.settings ?= {}
    data.settings.simulation ?= {}

    simulation = data.settings.simulation

    if not simulation.duration?
      if simulation.period? and simulation.stepSize?
        simulation.duration = Math.floor simulation.period / simulation.stepSize
      else
        simulation.duration = 10

    delete data.settings.simulation.period
    delete data.settings.simulation.stepSize
    delete data.settings.simulation.periodUnits

module.exports = _.mixin migration, require './migration-mixin'
