Relationship = require '../../models/relationship'
TimeUnits = require '../../utils/time-units'

migration =
  version: "1.9.0"
  description: "Adds simulation speed and capNodeValues settings"
  date: "2015-10-14"

  doUpdate: (data) ->
    data.settings ?= {}
    data.settings.simulation ?= {}

    data.settings.simulation.speed ?= 4

    if not data.settings.simulation.capNodeValues?
      if data.settings.capNodeValues
        data.settings.simulation.capNodeValues = data.settings.capNodeValues
      else
        data.settings.simulation.capNodeValues = false

    delete data.settings.capNodeValues



module.exports = _.mixin migration, require './migration-mixin'
