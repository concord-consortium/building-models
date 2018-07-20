AppSettingsStore = require('../../stores/app-settings-store').store

migration =
  version: "1.22.0"
  description: "Add simulation type"
  date: "2018-03-30"

  doUpdate: (data) ->
    data.settings ?= {}

    # previous complexities were:
    #  0: diagram only
    #  1: basic relationships
    #  2: expanded relationships
    #  3: collectors
    #
    # map these to
    #  0: simulation: diagramOnly / complexity: basic
    #  1: simulation: static      / complexity: basic
    #  2: simulation: static      / complexity: expanded
    #  3 (for models with nodes set up as collectors): simulation: time   / complexity: expanded
    #  3 (no collectors in model):                     simulation: static / complexity: expanded

    previousComplexity = if data.settings.complexity? then data.settings.complexity else 2

    if previousComplexity == 0
      data.settings.simulationType = AppSettingsStore.SimulationType.diagramOnly
      data.settings.complexity     = AppSettingsStore.Complexity.basic
    else if previousComplexity == 1
      data.settings.simulationType = AppSettingsStore.SimulationType.static
      data.settings.complexity     = AppSettingsStore.Complexity.basic
    else if previousComplexity == 2
      data.settings.simulationType = AppSettingsStore.SimulationType.static
      data.settings.complexity     = AppSettingsStore.Complexity.expanded
    else if previousComplexity == 3
      hasCollectors = data.nodes.some((node) -> node.data.isAccumulator)
      if hasCollectors
        data.settings.simulationType = AppSettingsStore.SimulationType.time
      else
        data.settings.simulationType = AppSettingsStore.SimulationType.static
      data.settings.complexity     = AppSettingsStore.Complexity.expanded

module.exports = _.mixin migration, require './migration-mixin'