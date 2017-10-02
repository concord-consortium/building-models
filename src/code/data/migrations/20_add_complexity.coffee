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
      AppSettingsStore.Complexity.diagramOnly
    else
      AppSettingsStore.Complexity.DEFAULT

    data.settings.complexity ?= defaultComplexity

module.exports = _.mixin migration, require './migration-mixin'
