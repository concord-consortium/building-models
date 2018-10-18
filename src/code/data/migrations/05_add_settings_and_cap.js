migration =
  version: "1.4.0"
  description: "Adds settings object and cap default."
  date: "2015-09-17"

  doUpdate: (data) ->
    data.settings ?= {}
    data.settings.capNodeValues ?= false

module.exports = _.mixin migration, require './migration-mixin'
