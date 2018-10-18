migration =
  version: "1.11.0"
  description: "Adds minigraphs settings"
  date: "2016-03-15"

  doUpdate: (data) ->
    data.settings ?= {}
    data.settings.showMinigraphs ?= false


module.exports = _.mixin migration, require './migration-mixin'
