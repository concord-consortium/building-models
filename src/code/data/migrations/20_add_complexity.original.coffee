AppSettingsStore = require('../../stores/app-settings-store').store

migration =
  version: "1.19.0"
  description: "Adds complexity setting, based on old diagramOnly. Removes diagramOnly"
  date: "2017-09-26"

  doUpdate: (data) ->
    data.settings ?= {}
    wasDiagramOnly = data.settings.diagramOnly or false

    delete data.settings.diagramOnly

    defaultComplexity = if wasDiagramOnly
      0 # was `AppSettingsStore.Complexity.diagramOnly` but this no longer exists as of 1.22.0
    else
      2 # was `AppSettingsStore.Complexity.DEFAULT` but this is now '1' as of 1.22.0

    data.settings.complexity ?= defaultComplexity

module.exports = _.mixin migration, require './migration-mixin'
