Relationship = require '../../models/relationship'

migration =
  version: "1.1.0"
  description: "Adds initial values and relationships."
  date: "2015-08-13"

  doUpdate: (data) ->
    @updateNodes(data)
    @updateLinks(data)

  # Add initialValue if it doesn't exist
  updateNodes: (data) ->
    for node in data.nodes
      node.data ||= {} # should never happen
      node.data.initialValue = 50
      node.data.isAccumulator = false

  # Add initialValue if it doesn't exist
  updateLinks: (data) ->
    defaultRelation =
      text        : Relationship.defaultText
      formula     : Relationship.defaultFormula

    for link in data.links
      link.relation = _.clone defaultRelation

module.exports = _.mixin migration, require './migration-mixin'
