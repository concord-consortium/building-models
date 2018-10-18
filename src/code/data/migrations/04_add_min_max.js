migration =
  version: "1.3.0"
  description: "Adds min and max values for nodes."
  date: "2015-09-03"

  doUpdate: (data) ->
    @updateNodes(data)

  # Add initialValue if it doesn't exist
  updateNodes: (data) ->
    for node in data.nodes
      node.data ||= {} # should never happen
      node.data.min = 0
      node.data.max = 100

module.exports = _.mixin migration, require './migration-mixin'
