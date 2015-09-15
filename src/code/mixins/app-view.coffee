Simulation      = require "../models/simulation"
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
      graphIsValid: true
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
    @props.graphStore.addChangeListener @onModelChanged

    @props.graphStore.addFilenameListener (filename) =>
      @setState filename: filename

    @_loadInitialData()
    @_registerUndoRedoKeys()
    PaletteStore.store.listen @onPaletteChange
    CodapStore.store.listen @onCodapStateChange

  componentDidUnmount: ->
    @addDeleteKeyHandler false

  onPaletteChange: (status) ->
    @setState
      palette: status.palette
      internalLibrary: status.internalLibrary

  onCodapStateChange: (status) ->
    @setState
      undoRedoShowing: not status.hideUndoRedo

  onModelChanged: ->
    simulator = new Simulation
      nodes: @props.graphStore.getNodes()
    @setState
      graphIsValid: simulator.graphIsValid()

  onNodeChanged: (node, data) ->
    @props.graphStore.changeNode data

  onNodeDelete: ->
    @props.graphStore.deleteSelected()

  runSimulation: ->
    if @state.graphIsValid
      simulator = new Simulation
        nodes: @props.graphStore.getNodes()
        duration: 10
        timeStep: 1
        reportFunc: (report) =>
          log.info report
          nodeInfo = (
            _.map report.endState, (n) ->
              "#{n.title} #{n.initialValue} → #{n.value}"
          ).join("\n")
          log.info "Run for #{report.steps} steps\n#{nodeInfo}:"
          @props.codapConnect.sendSimulationData(report)

      simulator.run()
      simulator.report()
    else
      alert tr "~DOCUMENT.ACTIONS.GRAPH_INVALID"

  # Update Selections. #TODO Move elsewhere
  _updateSelection: (manager) ->
    selectedNode = manager.getInspection()[0] or null
    editingNode  = manager.getTitleEditing()[0] or null
    selectedLink = manager.getLinkSelection()[0] or null

    @setState
      selectedNode: selectedNode
      editingNode: editingNode
      selectedLink: selectedLink

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
