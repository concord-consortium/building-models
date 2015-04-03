module.exports = class MySystemImporter

  constructor: (@system) ->
    undefined

  importData: (data) ->
    @importNodes data.nodes
    @importLinks data.links

  importNodes: (importNodes) ->
    for data in importNodes
      @system.importNode
        key: data.key
        data: data

  importLinks: (links) ->
    for data in links
      @system.importLink
        sourceNode: data.sourceNodeKey
        targetNode: data.targetNodeKey
        sourceTerminal: data.sourceTerminal
        targetTerminal: data.targetTerminal
        title: data.title
        color: data.color
