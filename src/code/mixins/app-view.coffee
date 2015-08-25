Simulation   = require "../models/simulation"
PaletteStore = require "../stores/palette-store"
CodapStore   = require "../stores/codap-store"

module.exports =

  getInitialAppViewState: (subState) ->
    mixinState =
      selectedNode: null
      selectedConnection: null
      palette: []
      filename: null
      undoRedoShowing: true
    _.extend mixinState, subState

  componentDidUpdate: ->
    log.info 'Did Update: AppView'

  addDeleteKeyHandler: (add) ->
    if add
      deleteFunction = @props.linkManager.deleteSelected.bind @props.linkManager
      $(window).on 'keydown', (e) ->
        if e.which is 8 and not $(e.target).is('input, textarea')
          e.preventDefault()
          deleteFunction()
    else
      $(window).off 'keydown'

  componentDidMount: ->
    @addDeleteKeyHandler true
    @props.linkManager.selectionManager.addSelectionListener @_updateSelection

    @props.linkManager.addFilenameListener (filename) =>
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

  getData: ->
    @props.linkManager.toJsonString @state.palette

  onNodeChanged: (node, data) ->
    @props.linkManager.changeNode data

  onNodeDelete: ->
    @props.linkManager.deleteSelected()

  runSimulation: ->
    simulator = new Simulation
      nodes: @props.linkManager.getNodes()
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
      @props.linkManager.loadData JSON.parse @props.data
    else if @props.url?.length > 0
      @props.linkManager.loadDataFromUrl @props.url

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
          @props.linkManager.redo() if redo
          @props.linkManager.undo() if undo
