Migrations          = require '../data/migrations/migrations'
DiagramNode         = require '../models/node'
TransferNode        = require '../models/transfer'
ImportActions       = require '../actions/import-actions'
GraphPrimitive      = require '../models/graph-primitive'

module.exports = class MySystemImporter

  constructor: (@graphStore, @settings, @paletteStore) ->
    undefined

  importData: (data) ->
    Migrations.update(data)
    # Synchronous invocation of actions / w trigger
    ImportActions.import.trigger(data)
    @importNodes data.nodes
    @importLinks data.links
    # set the nextID counters
    GraphPrimitive.initCounters({nodes: @graphStore.getNodes(), links: @graphStore.getLinks()})
    @graphStore.setFilename data.filename or 'New Model'

  importNode: (nodeSpec) ->
    data = nodeSpec.data
    key = nodeSpec.key
    if data.paletteItem
      data.image = @paletteStore.store.findByUUID(data.paletteItem)?.image
    if /^Transfer/.test(nodeSpec.key)
      new TransferNode(data, key)
    else
      new DiagramNode(data, key)

  importNodes: (importNodes) ->
    for nodespec in importNodes
      node = @importNode(nodespec)
      # ensure id matches key for imported documents
      node.id = node.key
      @graphStore.addNode node
    return  # prevent unused default return value

  importLinks: (links) ->
    for link in links
      @graphStore.importLink link
      # ensure id matches key for imported documents
      link.id = link.key
    return  # prevent unused default return value
