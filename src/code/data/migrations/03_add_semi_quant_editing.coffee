Relationship = require '../../models/relationship'

migration =
  version: "1.2.0"
  description: "Adds initial value for defining node semiquantitatively."
  date: "2015-09-02"

  doUpdate: (data) ->
    @updateNodes(data)
    data

  # Add initialValue if it doesn't exist
  updateNodes: (data) ->
    for node in data.nodes
      node.data ||= {} # should never happen
      node.data.valueDefinedSemiQuantitatively = true

module.exports = _.mixin migration, require './migration-mixin'
