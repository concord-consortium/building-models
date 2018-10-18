IframePhone = (require 'iframe-phone')
tr = require '../utils/translate'
LaraActions    = require '../actions/lara-actions'
UndoRedoUIStore = require '../stores/undo-redo-ui-store'
UndoRedo = require '../utils/undo-redo'
SimulationStore = require '../stores/simulation-store'
TimeUnits       = require '../utils/time-units'
escapeRegExp = (require '../utils/escape-reg-ex').escapeRegExp

module.exports = class LaraConnect

  @instances: {} # map of context -> instance

  @instance: (context) ->
    LaraConnect.instances[context] ?= new LaraConnect context
    LaraConnect.instances[context]

  constructor: (context) ->
    log.info 'LaraConnect: initializing'
    GraphStore = require '../stores/graph-store'
    PaletteStore  = require '../stores/palette-store'
    @undoRedoManager = UndoRedo.instance debug:false, context:context
    @loaded = false
    @graphStore = GraphStore.store
    @paletteStore = PaletteStore.store
    @laraPhone = IframePhone.getIFrameEndpoint()
    @lastCommandStackPosition = -1

    # Setup listeners
    @laraPhone.addListener 'initInteractive', (data) =>
      if not data
        @laraPhone.post "response", "init failed!"
      else
        log.info "Init received from parent", data
        @graphStore.setUsingLara true
        if typeof data is "string"
          data = JSON.parse data
        if data.content
          @graphStore.loadData data.content
        else
          @graphStore.loadData data
        nodeCount = @graphStore.getNodes().length
        loadResult = "Initialization success! Loaded " + nodeCount + " node(s)"
        log.info loadResult
        @laraPhone.post "response", loadResult
        @loaded = true

    @laraPhone.addListener 'getInteractiveState', (data) =>
      log.info "Request for interactiveState received from parent Iframe", data
      saveData = @graphStore.toJsonString @paletteStore.palette
      @laraPhone.post "interactiveState", saveData

    @graphStore.addChangeListener @onUndoRedoStateChange.bind(@)

    # load any previous data by initializing handshake
    @laraPhone.post 'initInteractive', 'Sage is ready'

  onUndoRedoStateChange: (state) ->
    lastAction = @undoRedoManager.commands[@undoRedoManager.stackPosition]
    if lastAction and @loaded
      if @undoRedoManager.stackPosition < (@undoRedoManager.commands.length - 1) and @lastCommandStackPosition > @undoRedoManager.stackPosition
        # User clicked Undo
        @laraPhone.post 'log', {action: "undo"}
      else
        @laraPhone.post 'log', {action: lastAction.name}
    @lastCommandStackPosition = @undoRedoManager.stackPosition
