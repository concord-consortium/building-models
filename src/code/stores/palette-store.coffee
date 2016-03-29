resizeImage    = require '../utils/resize-image'
initialPalette = require '../data/initial-palette'
initialLibrary = require '../data/internal-library'
UndoRedo       = require '../utils/undo-redo'
ImportActions  = require '../actions/import-actions'
uuid           = require 'uuid'


# TODO: Maybe loadData goes into some other action-set
paletteActions = Reflux.createActions(
  [
    "addToPalette", "selectPaletteIndex", "selectPaletteItem",
    "restoreSelection", "itemDropped","update", "delete"
  ]
)

paletteStore   = Reflux.createStore
  listenables: [paletteActions, ImportActions]

  init: ->
    @initializeLibrary()
    @initializePalette()
    # prepare a template for new library items
    @blankMetadata =
      source: 'external'
      title: 'blank'
      link: ''
      license: ''
    @imageMetadata = _.clone @blankMetadata, true
    @undoManger = UndoRedo.instance debug:true

  initializeLibrary: ->
    @library = {}
    for node in initialLibrary
      @addToLibrary node

  initializePalette: ->
    @palette = []
    for node in initialPalette
      @addToPalette node
    @selectPaletteIndex(0)
    @updateChanges()

  makeNodeSignature: (node) ->
    # 400 chars of a URL *might* be adequately unique,
    # but data urls are going to be more trouble.
    node.image.substr(0,400)


  standardizeNode: (node) ->
    node.image    ||= ""
    node.key      ||= @makeNodeSignature(node)
    node.uuid     ||= uuid.v4()
    node.metadata ||= _.clone @blankMetadata, true

  addToLibrary: (node) ->
    unless @inLibrary(node)
      @standardizeNode(node)
      @library[node.key] = node
      resizeImage node.image, (dataUrl) ->
        node.image = dataUrl
      log.info "library: #{@library}"

  onImport: (data) ->
    # reload the palette
    @palette = []
    if data.palette
      for p_item in data.palette by -1
        @addToPalette p_item
    @updateChanges()

  onUpdate: (data) ->
    if @selectedPaletteItem
      @selectedPaletteItem = _.merge @selectedPaletteItem, data
    else
      @selectedPaletteItem = data
    @updateChanges()

  onDelete: (paletteItem)->
    if paletteItem
      @undoManger.createAndExecuteCommand 'deletePaletteItem',
        execute: =>
          @removePaletteItem(paletteItem)
          @updateChanges()
        undo: =>
          @addToPalette(paletteItem)
          @updateChanges()

  addToPalette: (node) ->
    # PaletteItems always get added to library first
    @addToLibrary(node)
    if not @inPalette node
      @palette.push node
      @moveToFront(@palette.length-1)
      @selectPaletteIndex(0)

  onAddToPalette: (node) ->
    @undoManger.createAndExecuteCommand 'addPaletteItem',
      execute: =>
        @addToPalette(node)
        @updateChanges()
      undo:  =>
        @removePaletteItem(node)
        @updateChanges()


  onSelectPaletteIndex: (index) ->
    # @moveToFront(index) if we want to add the selected item to front
    @selectPaletteIndex(index)
    @updateChanges()

  onSelectPaletteItem: (item) ->
    index = _.indexOf @palette, item
    @selectPaletteIndex(index)
    @updateChanges()

  selectPaletteIndex: (index) ->
    maxIndex = @palette.length - 1
    effectiveIndex = Math.min(maxIndex, index)
    @lastSelection = @selectedIndex = effectiveIndex
    @selectedPaletteItem  = @palette[effectiveIndex]
    @selectedPaletteImage = @selectedPaletteItem?.image

  onRestoreSelection: ->
    if @lastSelection > -1
      @selectPaletteIndex @lastSelection
    else @selectPaletteIndex 0
    @updateChanges()

  onSetImageMetadata: (image, metadata) ->
    log.info "Set Image metadata called"
    @addToLibrary(image)
    libraryItem = @inLibrary(image)
    if libraryItem
      libraryItem.metadata = metadata
      @imageMetadata = libraryItem.metadata
      @updateChanges()
    else
      alert "cant find library item"

  removePaletteItem: (item) ->
    # Try to select the same index as the deleted item
    i = _.indexOf @palette, item
    @palette = _.without @palette, item
    @selectPaletteIndex(i)

  moveToFront: (index) ->
    @palette.splice(0, 0, @palette.splice(index, 1)[0])

  inPalette: (node) ->
    _.find @palette, {key: node.key}

  findByUUID: (uuid) ->
    _.find @palette, {uuid: uuid}

  inLibrary: (node) ->
    @library[node.key]

  updateChanges: ->
    data =
      palette: @palette
      library: @library
      selectedPaletteIndex: @selectedIndex
      selectedPaletteItem: @selectedPaletteItem
      selectedPaletteImage: @selectedPaletteImage
      imageMetadata: @imageMetadata

    log.info "Sending changes to listeners: #{JSON.stringify(data)}"
    @trigger(data)

mixin =
  getInitialState: ->
    palette: paletteStore.palette
    library: paletteStore.library
    selectedPaletteItem: paletteStore.selectedPaletteItem
    selectedPaletteIndex: paletteStore.selectedPaletteIndex
    selectedPaletteImage: paletteStore.selectedPaletteImage
    imageMetadata: paletteStore.imageMetadata

  componentDidMount: ->
    @paletteUnsubscribe = paletteStore.listen @onPaletteChange

  componentWillUnmount: ->
    @paletteUnsubscribe()

  onPaletteChange: (status) ->
    @setState
      palette: status.palette
      library: status.library
      selectedPaletteIndex: status.selectedPaletteIndex
      selectedPaletteItem: status.selectedPaletteItem
      selectedPaletteImage: status.selectedPaletteImage
      imageMetadata: status.imageMetadata

module.exports =
  actions: paletteActions
  store: paletteStore
  mixin: mixin

window.PaletteStore = module.exports
