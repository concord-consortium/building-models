Relationship = require '../../models/relationship'

migration =
  version: 1.4
  description: "Adds settings object and cap default."
  date: "2015-09-17"

  doUpdate: (data) ->
    data.settings ?= {}
    data.settings.capNodeValues ?= false
    data

module.exports = _.mixin migration, require './migration-mixin'
