uuid = require 'uuid'

imageToUUIDMap= {}

migration =
  version: "1.5.0"
  description: "Nodes reference PaletteItems"
  date: "2015-09-16"

  doUpdate: (data) ->
    @updatePalette(data)
    @updateNodes(data)

  updatePalette: (data) ->
    _.each data.palette, (paletteItem) ->
      paletteItem.uuid ||= uuid.v4()
      imageToUUIDMap[paletteItem.image] = paletteItem.uuid

  # Add initialValue if it doesn't exist
  updateNodes: (data) ->
    for node in data.nodes
      if node.data.image
        node.data.paletteItem = imageToUUIDMap[node.data.image]

module.exports = _.mixin migration, require './migration-mixin'
