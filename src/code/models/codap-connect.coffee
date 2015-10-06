IframePhoneRpcEndpoint = (require 'iframe-phone').IframePhoneRpcEndpoint
CodapStore = require "../stores/codap-store"
tr = require '../utils/translate'
module.exports = class CodapConnect

  name: 'Building Models Tool'

  codapPhone: null

  currentCaseID: null

  stepsInCurrentCase: 0

  queue: []

  @instances: {} # map of context -> instance

  @instance: (context) ->
    CodapConnect.instances[context] ?= new CodapConnect context
    CodapConnect.instances[context]

  constructor: (context) ->
    log.info 'CodapConnect: initializing'
    GraphStore = require '../stores/graph-store'
    @graphStore = GraphStore.store

    @codapPhone = new IframePhoneRpcEndpoint( @codapRequestHandler,
      'codap-game', window.parent )

    @codapPhone.call( {
      action: 'initGame'
      args:
        name: @name
        dimensions:
          width: 800
          height: 600
        collections: [
          {
            name: 'Simulation'
            attrs: [
              {
                name: tr '~CODAP.SIMULATION.STEPS'
                type: 'numeric'
                description: tr '~CODAP.SIMULATION.STEPS.DESCRIPTION'
                precision: 0
              }
            ]
          }
        ]
        contextType: 'DG.DataContext'
    }, @initGameHandler)

  openNewCase: (nodeNames) ->
    # First column definition is the time index
    sampleDataAttrs = [
      {
        name: "time"
        type: "numeric"
      }
    ]

    # Append node names to column descriptions.
    _.each nodeNames, (name) ->
      sampleDataAttrs.push
        name: name
        type: 'numeric'

    @codapPhone.call
      action: 'createCollection'
      args:
        name: 'Samples'
        attrs: sampleDataAttrs

    @codapPhone.call {
      action: 'openCase'
      args: {
        collection: 'Simulation',
        values: [0]
      }
    }, (result) =>
      if result?.success
        @currentCaseID = result.caseID
        @stepsInCurrentCase = 0
        @_flushQueue()
      else
        @currentCaseID = null
        log.info "CODAP returned an error on 'openCase'"

  sendSimulationData: (data) ->
    if not @currentCaseID
      # openNewCase may not have completed yet, so we queue these up
      @queue.push data
      return

    # Create the sample data values (node values array)
    sampleData = _.map data.frames, (frame) ->
      sample     = [frame.time]
      _.each frame.nodes, (n) -> sample.push n.value
      sample

    # Send the data
    @codapPhone.call
      action: 'createCases'
      args: {
        collection: 'Samples',
        parent: @currentCaseID,
        values: sampleData
      }

    # Update the parent case with the current number of steps
    @stepsInCurrentCase += sampleData.length
    @codapPhone.call
      action: 'updateCase'
      args: {
        collection: 'Simulation',
        caseID: @currentCaseID
        values: [@stepsInCurrentCase]
      }

  _flushQueue: ->
    for data in @queue
      @sendSimulationData data
    @queue = []

  sendUndoableActionPerformed: ->
    @codapPhone.call
      action: 'undoableActionPerformed'

  codapRequestHandler: (cmd, callback) =>
    operation = cmd.operation
    args = cmd.args
    paletteManager = require '../stores/palette-store'
    switch operation
      when 'saveState'
        log.info 'Received saveState request from CODAP.'
        callback
          success: true
          state: @graphStore.serialize paletteManager.store.palette

      when 'restoreState'
        log.info 'Received restoreState request from CODAP.'
        @graphStore.deleteAll()
        @graphStore.loadData args.state
        callback
          success: true

      when 'externalUndoAvailable'
        log.info 'Received externalUndoAvailable request from CODAP.'
        CodapStore.actions.hideUndoRedo()

      when 'undoAction'
        log.info 'Received undoAction request from CODAP.'
        successes = @graphStore.undo()
        callback {success: @reduceSuccesses(successes) isnt false}

      when 'redoAction'
        log.info 'Received redoAction request from CODAP.'
        successes = @graphStore.redo()
        callback {success: @reduceSuccesses(successes) isnt false}

      else
        log.info 'Unknown request received from CODAP: ' + operation

  # undo/redo events can return an array of successes
  # this reduces that array to true iff every element is not explicitly false
  reduceSuccesses: (successes) ->
    return successes unless successes?.length        # return successes unless it's a non-zero length array
    return false for s in successes when s is false  # return false if we encounter *any* explicit false values in the array
    return true

  initGameHandler: (result) ->
    if result and result.success
      CodapStore.actions.codapLoaded()

  #
  # Requests a CODAP action, if the Building Models tool is configured to reside
  # in CODAP. For actions that may be requested, see
  # https://github.com/concord-consortium/codap/wiki/Data-Interactive-API .
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
      @codapPhone.call { action: action, args: args }, (reply) ->
        if callback
          callback reply
        if reply and reply.success
          resolve reply
        else
          reject 'CODAP request error'
    promise
