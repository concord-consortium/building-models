Migrations          = require '../data/migrations/migrations'
DiagramNode         = require '../models/node'
TransferNode        = require '../models/transfer'
ImportActions       = require '../actions/import-actions'

module.exports = class MySystemImporter

  constructor: (@graphStore, @settings, @paletteStore) ->
    undefined

  importData: (data) ->
    Migrations.update(data)
    # Synchronous invocation of actions / w trigger
    ImportActions.import.trigger(data)
    hasCollectors = @importNodes data.nodes

    simType = @settings.settings.simulationType

    if simType == @settings.SimulationType.time and hasCollectors == false
      # Downgrade to static equilibrium - older models with the "can have collectors" checkbox
      # will always import as time-based simulations even if they don't have collectors
      @settings.settings.simulationType = @settings.SimulationType.static

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
    hasCollectors = false
    for nodespec in importNodes
      node = @importNode(nodespec)
      if node._isAccumulator then hasCollectors = true
      @graphStore.addNode node
    return hasCollectors

  importLinks: (links) ->
    for link in links
      @graphStore.importLink link
    return  # prevent unused default return value
