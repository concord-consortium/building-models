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
    @standaloneMode = false
    @queue = []
    @graphStore = GraphStore.store
    @lastTimeSent = @_timeStamp()
    @sendThrottleMs = 300

    @laraPhone = IframePhone.getIFrameEndpoint()

    # Setup listeners
    @laraPhone.addListener 'initInteractive', (data) =>
      console.log "Init received from parent", data
      if typeof data is "string"
        data = JSON.parse data
      if data and data.content
        @graphStore.loadData data.content
        nodeCount = @graphStore.getNodes().length
        console.log "loaded " + nodeCount + " node(s)"
        @laraPhone.post "response", "init Success!"
      else

    @laraPhone.addListener 'getInteractiveState', (data) =>
      console.log "Get Request for state received from parent - TODO: Respond with interactiveState", data
      @laraPhone.post "response", data

    @laraPhone.addListener 'interactiveState', (data) =>
      console.log "Request for state received from parent", data
      serializedData = @graphStore.serialize
      @laraPhone.post "response", serializedData

    # load any previous data by initializing handshake
    @laraPhone.post 'initInteractive', 'hi'

  _timeStamp: ->
    new Date().getTime()

  _shouldSend: ->
    currentTime = @_timeStamp()
    elapsedTime = currentTime - @lastTimeSent
    return elapsedTime > @sendThrottleMs

