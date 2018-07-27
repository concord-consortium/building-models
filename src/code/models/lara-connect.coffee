IframePhoneRpcEndpoint = (require 'iframe-phone').IframePhoneRpcEndpoint
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

    @dataContextName = "Sage Simulation"
    @simulationCollectionName = "Simulation"
    @samplesCollectionName = "Samples"

    @laraPhone = new IframePhoneRpcEndpoint( @laraRequestHandler,
      'initInteractive', window.parent )

    # load any previous data
    @laraPhone.call(
      'initInteractive',
      (response) -> console.log(response)

    )

    console.log('got lara?')
    @graphStore.setUsingLara true


  _timeStamp: ->
    new Date().getTime()


  _shouldSend: ->
    currentTime = @_timeStamp()
    elapsedTime = currentTime - @lastTimeSent
    return elapsedTime > @sendThrottleMs

  laraRequestHandler: (cmd, callback) ->
    console.log(cmd)


  #
  # Requests a CODAP action, if the Building Models tool is configured to reside
  # in CODAP. For actions that may be requested, see
  # https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API .
  #
  # Similarly to the Google Drive API, this method will report results of its
  # asynchronous request either by invoking the provided callback, or, if no
  # callback is provided, will return a Promise.
  #
  # Example:
  #   codapConnect.request('logAction', {formatStr: 'test message'}).then ->
  #     log.info 'received log reply!'
  #

  request: (action, args, callback) ->
    promise = new Promise (resolve, reject) =>
      @laraPhone.call { action: action, args: args }, (reply) ->
        if callback
          callback reply
        if reply and reply.success
          resolve reply
        else
          reject 'LARA request error'
    promise
