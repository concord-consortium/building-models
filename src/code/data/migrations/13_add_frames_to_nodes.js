migration =
  version: "1.12.0"
  description: "Adds minigraphs data"
  date: "2016-03-16"

  doUpdate: (data) ->
    @updateNodes(data)

  updateNodes: (data) ->
    for node in data.nodes
      node.data.frames ?= []

module.exports = _.mixin migration, require './migration-mixin'
