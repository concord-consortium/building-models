LinkManager    = require './link-manager'

# TODO: Maybe loadData goes into some other action-set
paletteActions = Reflux.createActions(
  ["addToPalette","loadData", "selectPaletteIndex", "itemDropped"]
)

paletteStore   = Reflux.createStore
  # NOTE: This Reflux shortcut does not work as advertised,
  # listenables: paletteActions

  init: ->
    # NOTE: This Reflux shortcut does not work either:
    # this.listenToMany(paletteActions)
    @listenTo paletteActions.addToPalette, @onAddToPallete
    @listenTo paletteActions.loadData, @onloadData
    @listenTo paletteActions.selectPaletteIndex, @onSelectPaletteIndex
    @listenTo paletteActions.itemDropped, @onItemDropped

    @palette = require '../data/initial-palette'
    @selectPaletteIndex = 0

    @_updateChanges()

    # TODO: this doesn't seem safe
    @linkManager = LinkManager.instance 'building-models'
    @linkManager.addLoadListener @onLoadData

    # load the metadata at startup
    @internalLibrary = require '../data/internal-library'
    for node in @internalLibrary
      @linkManager.setImageMetadata node.image, node.metadata

  onLoadData: (data) ->
    @info "onLoadData called"
    # reload the palette
    if data.palette
      @palette = data.palette.slice 0
    for node in data.nodes
      @_addToPallete node
    @_updateChanges()

  _addToPallete: (node) ->
    # make sure this is a new image
    if not @inPalette node
      @palette.push
        title: node.title or ''
        image: node.image
        metadata: node.metadata
      if node.metadata
        @linkManager.setImageMetadata node.image, node.metada
      @_pushToFront(@palette.length-1)

  onAddToPallete: (node) ->
    @_addToPallete(node)
    @_updateChanges()

  onSelectPaletteIndex: (index) ->
    @_pushToFront(index)
    @_updateChanges()

  onItemDropped: (image) ->
    found = _.findIndex @palette, (i) ->
      i.image == image
    if found
      @_pushToFront(found)
    @_updateChanges()


  _pushToFront: (index) ->
    @palette.splice(0, 0, @palette.splice(index, 1)[0])
    @selectedPaletteItem = @palette[0]

  inPalette: (node) ->
    @_nodeInUse node, @palette

  inLibrary: (node) ->
    @_nodeInUse node, @internalLibrary

  info: (msg) ->
    log.info("PaletteManager: #{msg}")

  _updateChanges: ->
    data =
      palette: @palette
      internalLibrary: @internalLibrary
      selectedIndex: 0
      selectedPaletteItem: @palette[0]
    @info "Sending changes to listeners: #{JSON.stringify(data)}"
    @trigger(data)

  _nodeInUse: (node, collection) ->
    !!((_.find collection, {image: node.image}) or (node.metadata and (_.find collection, {metadata: {link: node.metadata.link}})))


module.exports =
  actions: paletteActions
  store: paletteStore
