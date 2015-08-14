resizeImage    = require '../utils/resize-image'
initialPalette = require '../data/initial-palette'
initialLibrary = require '../data/internal-library'

# TODO: Maybe loadData goes into some other action-set
paletteActions = Reflux.createActions(
  [
    "addToPalette", "loadData", "selectPaletteIndex",
    "deselect", "restoreSelection", "itemDropped",
    "update", "deleteSelected"
  ]
)

paletteStore   = Reflux.createStore
  listenables: [paletteActions]

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

  standardizeNode: (node) ->
    node.image    ||= ""
    node.key      ||= node.image.substr(0,400)
    node.metadata ||= _.clone @blankMetadata, true

  addToLibrary: (node) ->
    unless @inLibrary(node)
      @standardizeNode(node)
      @library[node.key] = node
      resizeImage node.image, (dataUrl) ->
        node.image = dataUrl
      log.info "library: #{@library}"

  onLoadData: (data) ->
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

  onDeleteSelected: ->
    if @deleteSelected()
      @updateChanges()

  deleteSelected: ->
    if @selectedPaletteItem
      @palette = _.without @palette, @selectedPaletteItem
      @deselect()
      return true
    return false

  addToPalette: (node) ->
    # ensure its in our library first
    @addToLibrary(node)
    if not @inPalette node
      @palette.push node
      @moveToFront(@palette.length-1)
      @selectPaletteIndex(0)

  onAddToPalette: (node) ->
    @addToPalette(node)
    @updateChanges()

  onSelectPaletteIndex: (index) ->
    # @moveToFront(index) if we want to add the selected item to front
    @selectPaletteIndex(index)
    @updateChanges()

  selectPaletteIndex: (index) ->
    @lastSelection = @selectedIndex = index
    @selectedPaletteItem  = @palette[index]
    @selectedPaletteImage = @selectedPaletteItem.image

  deselect: ->
    @lastSelection = @selectedIndex
    @selectedPaletteIndex = -1
    @selectedPaletteItem  = null

  onDeselect: ->
    @deselect()
    # @updateChanges()

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

  moveToFront: (index) ->
    @palette.splice(0, 0, @palette.splice(index, 1)[0])

  inPalette: (node) ->
    _.find @palette, {key: node.key}

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
    paletteStore.listen @onPaletteChange

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
