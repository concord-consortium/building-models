Migrations          = require '../data/migrations/migrations'
DiagramNode         = require '../models/node'
TransferNode        = require '../models/transfer'
ImportActions       = require '../actions/import-actions'

module.exports = class MySystemImporter

  constructor: (@graphStore, @settings, @paletteStore) ->
    undefined

  importData: (data) ->
    Migrations.update(data)
    # increment last saved experiment number so that each session will
    # create its own experiments, and not append a prior session's
    data.settings?.simulation?.experimentNumber++
    data.settings?.simulation?.experimentFrame = 0
    # Synchronous invocation of actions / w trigger
    ImportActions.import.trigger(data)
    @importNodes data.nodes
    @importLinks data.links
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
      @graphStore.addNode node
    return  # prevent unused default return value

  importLinks: (links) ->
    for link in links
      @graphStore.importLink link
    return  # prevent unused default return value
