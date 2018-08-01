IframePhone = (require 'iframe-phone')
tr = require '../utils/translate'
LaraActions    = require '../actions/lara-actions'
undoRedoUIActions = (require '../stores/undo-redo-ui-store').actions
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
    @standaloneMode = false
    @queue = []
    @graphStore = GraphStore.store
    @paletteStore = PaletteStore.store
    @lastTimeSent = @_timeStamp()
    @sendThrottleMs = 300

    @laraPhone = IframePhone.getIFrameEndpoint()

    # Setup listeners
    @laraPhone.addListener 'initInteractive', (data) =>
      if not data
        @laraPhone.post "response", "init failed!"
      else
        console.log "Init received from parent", data
        if typeof data is "string"
          data = JSON.parse data
        if data.content
          @graphStore.loadData data.content
        else
          @graphStore.loadData data
        nodeCount = @graphStore.getNodes().length
        console.log "loaded " + nodeCount + " node(s)"
        @laraPhone.post "response", "init Success!"

    @laraPhone.addListener 'getInteractiveState', (data) =>
      console.log "Request for state received from parent", data
      saveData = @graphStore.toJsonString @paletteStore.palette
      @laraPhone.post "interactiveState", saveData

    # load any previous data by initializing handshake
    @laraPhone.post 'initInteractive', 'Sage is ready'

  _timeStamp: ->
    new Date().getTime()

  _shouldSend: ->
    currentTime = @_timeStamp()
    elapsedTime = currentTime - @lastTimeSent
    return elapsedTime > @sendThrottleMs

