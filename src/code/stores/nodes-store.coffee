PaletteStore = require './palette-store'

nodeActions = Reflux.createActions(
  [
    "nodesChanged"
  ]
)

nodeStore   = Reflux.createStore
  listenables: [nodeActions]

  init: ->
    @nodes               = []
    @paletteItemHasNodes = false
    
    PaletteStore.store.listen => @internalUpdate()

  onNodesChanged: (nodes) ->
    @nodes = nodes
    @internalUpdate()

  internalUpdate: ->
    selectedPaletteItem = PaletteStore.store.selectedPaletteItem
    @paletteItemHasNodes = false
    return unless selectedPaletteItem
    _.each @nodes, (node) =>
      if node.paletteItemIs selectedPaletteItem
        @paletteItemHasNodes = true
    @notifyChange()

  notifyChange: ->
    data =
      nodes: @nodes
      paletteItemHasNodes: @paletteItemHasNodes
    @trigger(data)

mixin =
  getInitialState: ->
    nodes: nodeStore.nodes
    paletteItemHasNodes: nodeStore.paletteItemHasNodes

  componentDidMount: ->
    nodeStore.listen @onNodesChange

  onNodesChange: (status) ->
    @setState
      # nodes: status.nodes
      paletteItemHasNodes: status.paletteItemHasNodes

module.exports =
  actions: nodeActions
  store: nodeStore
  mixin: mixin

window.PaletteStore = module.exports
