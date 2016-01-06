Relationship = require '../../models/relationship'
TimeUnits = require '../../utils/time-units'

migration =
  version: 1.95
  description: "Adds simulation engine settings"
  date: "2016-01-16"

  doUpdate: (data) ->
    data.settings ?= {}
    data.settings.simulation ?= {}

    data.settings.simulation.newIntegration ?= false


module.exports = _.mixin migration, require './migration-mixin'
