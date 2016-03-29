PaletteStore    = require "../stores/palette-store"
CodapStore      = require "../stores/codap-store"
GoogleFileStore = require "../stores/google-file-store"
HashParams      = require "../utils/hash-parameters"
tr              = require '../utils/translate'

module.exports =

  getInitialAppViewState: (subState) ->
    mixinState =
      selectedNode: null
      selectedConnection: null
      palette: []
      filename: null
      undoRedoShowing: true
      showBuildInfo: false
    _.extend mixinState, subState

  componentDidUpdate: ->
    log.info 'Did Update: AppView'

  addDeleteKeyHandler: (add) ->
    if add
      deleteFunction = @props.graphStore.deleteSelected.bind @props.graphStore
      $(window).on 'keydown', (e) ->
        if e.which is 8 and not $(e.target).is('input, textarea')
          e.preventDefault()
          deleteFunction()
    else
      $(window).off 'keydown'

  componentDidMount: ->
    @addDeleteKeyHandler true
    @props.graphStore.selectionManager.addSelectionListener @_updateSelection

    @props.graphStore.addFilenameListener (filename) =>
      @setState filename: filename

    @_loadInitialData()
    @_registerUndoRedoKeys()
    PaletteStore.store.listen @onPaletteChange
    CodapStore.store.listen @onCodapStateChange

  componentWillUnmount: ->
    @addDeleteKeyHandler false

  onPaletteChange: (status) ->
    @setState
      palette: status.palette
      internalLibrary: status.internalLibrary

  onCodapStateChange: (status) ->
    @setState
      undoRedoShowing: not status.hideUndoRedo

  onNodeChanged: (node, data) ->
    @props.graphStore.changeNode data

  onNodeDelete: ->
    @props.graphStore.deleteSelected()

  # Update Selections. #TODO Move elsewhere
  _updateSelection: (manager) ->
    selectedNode = manager.getNodeInspection()[0] or null
    editingNode  = manager.getNodeTitleEditing()[0] or null
    selectedLink = manager.getLinkInspection()[0] or null

    @setState
      selectedNode: selectedNode
      editingNode: editingNode
      selectedLink: selectedLink

    @selectionUpdated()

  _loadInitialData: ->
    if @props.data?.length > 0
      @props.graphStore.addAfterAuthHandler JSON.parse @props.data
      HashParams.clearParam('data')

    else if @props.publicUrl?.length > 0
      publicUrl = @props.publicUrl
      GoogleFileStore.actions.addAfterAuthHandler (context) ->
        context.loadPublicUrl publicUrl
      HashParams.clearParam('publicUrl')

    else if @props.googleDoc?.length > 0
      googleDoc = @props.googleDoc
      GoogleFileStore.actions.addAfterAuthHandler (context) ->
        context.loadFile {id: googleDoc}

  hideBuildInfo: ->
    @setState
      showBuildInfo: false

  showBuildInfo: ->
    @setState
      showBuildInfo: true

  # cross platform undo/redo key-binding ctr-z ctr-y
  _registerUndoRedoKeys: ->
    ($ window).on 'keydown', (e) =>
      y = (e.keyCode is 89) or (e.keyCode is 121)
      z = (e.keyCode is 90) or (e.keyCode is 122)
      return if not (y or z)
      if e.metaKey
        undo = z and not e.shiftKey
        redo = (z and e.shiftKey) or y
      else if e.ctrlKey
        undo = z
        redo = y
      else
        undo = redo = false
      if undo or redo
        if (@state.undoRedoShowing)
          e.preventDefault()
          @props.graphStore.redo() if redo
          @props.graphStore.undo() if undo
