Relationship = require '../../models/relationship'

migration =
  version: "1.6.0"
  description: "Adds diagramOnly setting. Default == false"
  date: "2015-09-22"

  doUpdate: (data) ->
    data.settings ?= {}
    data.settings.diagramOnly ?= false
    data

module.exports = _.mixin migration, require './migration-mixin'
