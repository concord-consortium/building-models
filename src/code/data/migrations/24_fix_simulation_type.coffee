AppSettingsStore = require('../../stores/app-settings-store').store

migration =
  version: "1.23.0"
  description: "Fix simulation type - 1.21.0 to 1.22.0 sim-type broken"
  date: "2018-10-15"

  doUpdate: (data) ->
    data.settings ?= {}

    # This migration addresses a failing case where a simulation with
    # collector nodes was not coreectly migrating the simulationType
    # to time-based.
    
    if data.nodes.some((node) -> node.data.isAccumulator)
      data.settings.simulationType = AppSettingsStore.SimulationType.time

module.exports = _.mixin migration, require './migration-mixin'