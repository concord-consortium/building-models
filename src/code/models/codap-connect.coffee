IframePhoneRpcEndpoint = (require 'iframe-phone').IframePhoneRpcEndpoint
CodapStore = require "../stores/codap-store"
tr = require '../utils/translate'
module.exports = class CodapConnect

  name: 'Building Models Tool'

  codapPhone: null

  initAccomplished: false

  @instances: {} # map of context -> instance

  @instance: (context) ->
    CodapConnect.instances[context] ?= new CodapConnect context
    CodapConnect.instances[context]

  constructor: (context) ->
    log.info 'CodapConnect: initializing'
    LinkManager = require './link-manager'
    @linkManager = LinkManager.instance context

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
                name: 'steps'
                type: 'numeric'
                description: tr '~CODAP.SIMULATION.STEPS.DESCRIPTION'
                precision: 0
              }
            ]
          }
        ]
        contextType: 'DG.DataContext'
    }, @initGameHandler)



  sendSimulationData: (data) ->
    # First column definition is the time index
    sampleDataAttrs = [
      {
        name: "time"
        type: "numeric"
      }
    ]

    # Append node names to column descriptions.
    _.each data.nodeNames, (name) ->
      sampleDataAttrs.push
        name: name
        type: 'numeric'

    # Fill in the sample data values (node values array)
    sampleData = _.map data.frames, (frame) ->
      sample     = [frame.time]
      _.each frame.nodes, (n) -> sample.push n.value
      sample

    # see: https://github.com/concord-consortium/codap/wiki/Data-Interactive-API#createcollection
    @codapPhone.call
      action: 'createCollection'
      args:
        name: 'Samples'
        attrs: sampleDataAttrs

    # called by CODAP when 'openCase' is received.
    openCaseCallback = (result) =>
      if result
        if result.success
          @codapPhone.call
            action: 'createCases'
            args: {
              collection: 'Samples',
              parent: result.caseID,
              values: sampleData
            }
        else
          log.info "CODAP returned an error on 'createCase'"
      else
        log.info "Unable to call 'createCase' in CODAP (phone timeout?)"

    @codapPhone.call( {
      action: 'openCase'
      args: {
        collection: 'Simulation',
        values: [data.steps]
        }
    }, openCaseCallback)

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
          state: @linkManager.serialize paletteManager.store.palette

      when 'restoreState'
        log.info 'Received restoreState request from CODAP.'
        @linkManager.deleteAll()
        @linkManager.loadData args.state
        callback
          success: true

      when 'externalUndoAvailable'
        log.info 'Received externalUndoAvailable request from CODAP.'
        @linkManager.hideUndoRedo(true)

      when 'undoAction'
        log.info 'Received undoAction request from CODAP.'
        successes = @linkManager.undo()
        callback {success: @reduceSuccesses successes}

      when 'redoAction'
        log.info 'Received redoAction request from CODAP.'
        successes = @linkManager.redo()
        callback {success: @reduceSuccesses successes}

      else
        log.info 'Unknown request received from CODAP: ' + operation

  # undo/redo events can return an array of successes
  # this reduces that array to true iff every element is true
  reduceSuccesses: (successes) ->
    return successes unless successes.length
    return false for s in successes when s is false
    return true

  initGameHandler: (result) =>
    if result and result.success
      @initAccomplished = true
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
