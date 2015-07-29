LinkManager    = require './link-manager'

# TODO: Maybe loadData goes into some other action-set
paletteActions = Reflux.createActions(
  [
    "addToPalette", "loadData", "selectPaletteIndex",
    "setImageMetadata", "itemDropped"
  ]
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
    @listenTo paletteActions.setImageMetadata, @onSetImageMetadata

    @palette = require '../data/initial-palette'
    @selectPaletteIndex = 0
    @blankMetadata =
      source: 'external'
      title: ''
      link: ''
    @imageMetadata = @blankMetadata
    @metadataCache = {}

    @_updateChanges()

    # TODO: this doesn't seem safe
    @linkManager = LinkManager.instance 'building-models'
    @linkManager.addLoadListener @onLoadData

    # load the metadata at startup
    @internalLibrary = require '../data/internal-library'
    for node in @internalLibrary
      @_addMetadata node.image, node.metadata

  _addMetadata: (image,metadata) ->
    @metadataCache[image] = metadata or @blankMetadata

  getMetaData: (image) ->
    @metadataCache[image]

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
      @_addMetadata(node.image, node.metadata)
      @_pushToFront(@palette.length-1)

  onAddToPallete: (node) ->
    @_addToPallete(node)
    @_updateChanges()

  onSelectPaletteIndex: (index) ->
    # @_pushToFront(index) if we want to add the selected item to front
    @selectedPaletteIndex = index
    @selectedPaletteItem  = @palette[index]
    @selectedPaletteImage = @selectedPaletteItem.image
    @imageMetadata = @getMetaData(@selectedPaletteImage)
    @imageMetadata ||= @blankMetadata
    @_updateChanges()

  onSetImageMetadata: (image, metadata) ->
    @_addMetadata(image, metadata)
    @imageMetadata = metadata
    @_updateChanges()

  # TODO: Maybe later we want to reorganize palette in last used order
  onItemDropped: (image) ->
    found = _.findIndex @palette, (i) ->
      i.image == image
    if found
      @_pushToFront(found)
    @_updateChanges()

  _pushToFront: (index) ->
    @palette.splice(0, 0, @palette.splice(index, 1)[0])

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
      selectedPaletteIndex: @selectedPaletteIndex
      selectedPaletteItem: @selectedPaletteItem
      selectedPaletteImage: @selectedPaletteImage
      imageMetadata: @imageMetadata

    @info "Sending changes to listeners: #{JSON.stringify(data)}"
    @trigger(data)

  _nodeInUse: (node, collection) ->
    !!((_.find collection, {image: node.image}) or (node.metadata and (_.find collection, {metadata: {link: node.metadata.link}})))

  _loadInitialiMetadata: (data) ->
    if data.imageMetadata
      _.forEach data.imageMetadata, (metadata, image) =>
        @_addMetadata image, metadata

module.exports =
  actions: paletteActions
  store: paletteStore
