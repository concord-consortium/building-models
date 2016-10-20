IframePhoneRpcEndpoint = (require 'iframe-phone').IframePhoneRpcEndpoint
tr = require '../utils/translate'
CodapActions    = require '../actions/codap-actions'
SimulationStore = require '../stores/simulation-store'
TimeUnits       = require '../utils/time-units'

module.exports = class CodapConnect

  name: 'SageModeler'

  codapPhone: null

  currentCaseID: null

  standaloneMode: false

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

    SimulationStore.actions.simulationStarted.listen       @_openNewCase.bind(@)
    SimulationStore.actions.simulationFramesCreated.listen @_sendSimulationData.bind(@)
    CodapActions.sendUndoToCODAP.listen @_sendUndoToCODAP.bind(@)
    CodapActions.sendRedoToCODAP.listen @_sendRedoToCODAP.bind(@)


    @codapPhone = new IframePhoneRpcEndpoint( @codapRequestHandler,
      'data-interactive', window.parent )

    # load any previous data
    @codapPhone.call
      action: 'get',
      resource: 'interactiveFrame'
    , (ret) =>
      state = ret.values.savedState
      if state?
        @graphStore.deleteAll()
        @graphStore.loadData state


    timeUnit = TimeUnits.toString SimulationStore.store.settings.stepUnits, true
    sampleDataAttrs = [
      {
        name: timeUnit
        type: "numeric"
      }
    ]

    # check if we already have a datacontext (if we're opening a saved model).
    # if we don't create one with our collections. Then kick off init
    @codapPhone.call
      action: 'get',
      resource: 'dataContext[Sage Simulation]'
    , (ret) =>
      if ret?.success
        @initGameHandler
      else
        @codapPhone.call
          action: 'create',
          resource: 'dataContext',
          values: {
            name: 'Sage Simulation',
            title: 'Sage Simulation'
            collections: [ {
              name: 'Simulation',
              title: 'Sage Simulation',
              labels: {
                singleCase: 'run',
                pluralCase: 'runs'
              },
              attrs: [
                  {
                    name: tr '~CODAP.SIMULATION.RUN'
                    formula: 'caseIndex'
                    type: 'nominal'
                  }
                  {
                    name: tr '~CODAP.SIMULATION.STEPS'
                    type: 'numeric'
                    formula: 'count(Steps)'
                    description: tr '~CODAP.SIMULATION.STEPS.DESCRIPTION'
                    precision: 0
                  }
                ]
              },
              {
                parent: "Simulation",
                name: 'Samples',
                title: 'Samples',
                labels: {
                  singleCase: 'sample',
                  pluralCase: 'samples'
                }
                attrs: sampleDataAttrs
              }
            ]
          }
        , @initGameHandler

  _openNewCase: (nodeNames) ->
    @currentCaseID = null

    @_createCollection(nodeNames)

    @codapPhone.call
      action: 'create',
      resource: 'collection[Simulation].case',
      values: [ {} ]
    , (result) =>
      if result?.success
        @currentCaseID = result.values[0].id
        @stepsInCurrentCase = 0
        @_flushQueue()
        if not @standaloneMode
          @createTable()
      else
        log.info "CODAP returned an error on 'openCase'"

  _createCollection: (nodeNames) ->
    nodes = @graphStore.getNodes()

    # First column definition is the time index
    timeUnit = TimeUnits.toString SimulationStore.store.settings.stepUnits, true
    sampleDataAttrs = [
      {
        name: timeUnit
        type: "numeric"
      }
    ]

    addSampleDataAttr = (node) ->
      type = if node.valueDefinedSemiQuantitatively then 'qualitative' else 'numeric'
      sampleDataAttrs.push
        name: node.title
        type: type

    # Append node names to column descriptions.
    if (nodeNames)
      _.each nodeNames, (name) ->
        node = (nodes.filter (n) -> n.title is name)[0]
        addSampleDataAttr(node)
    else
      _.each nodes, (node) ->
        addSampleDataAttr(node)

    @codapPhone.call
      action: 'create',
      resource: 'collection[Samples].attribute',
      values: sampleDataAttrs

  _sendSimulationData: (data) ->
    if not @currentCaseID
      # openNewCase may not have completed yet, so we queue these up
      @queue.push data
      return

    timeUnit = TimeUnits.toString SimulationStore.store.settings.stepUnits, true

    # Create the sample data values (node values array)
    sampleData = _.map data, (frame) =>
      sample = {
        parent: @currentCaseID
        values: {}
      }
      sample.values[timeUnit] = frame.time
      _.each frame.nodes, (n) -> sample.values[n.title] = n.value
      sample

    # Send the data, if any
    if sampleData.length > 0
      @codapPhone.call
        action: 'create',
        resource: "collection[Samples].case",
        values: sampleData

  _sendUndoToCODAP: ->
    @codapPhone.call
      action: 'notify',
      resource: 'UndoChangeNotice'
      values: {
        operation: 'undoAction'
      }

  _sendRedoToCODAP: ->
    @codapPhone.call
      action: 'notify',
      resource: 'UndoChangeNotice'
      values: {
        operation: 'redoAction'
      }

  _flushQueue: ->
    for data in @queue
      @_sendSimulationData data
    @queue = []

  sendUndoableActionPerformed: (logMessage) ->
    @codapPhone.call
      action: 'notify',
      resource: 'UndoChangeNotice'
      values: {
        operation: 'undoableActionPerformed',
        logMessage: logMessage
      }

  createGraph: (yAttributeName)->
    @_createCollection()

    @codapPhone.call
      action: 'create',
      resource: 'component',
      values:
        type: 'graph'
        xAttributeName: timeUnit,
        yAttributeName: yAttributeName,
        size: { width: 242, height: 221 },
        position: 'bottom'

  createTable: (yAttributeName)->
    @codapPhone.call
      action: 'create',
      resource: 'component',
      values:
        type: 'caseTable'

  codapRequestHandler: (cmd, callback) =>
    resource = cmd.resource
    action = cmd.action
    operation = cmd.values?.operation
    paletteManager = require '../stores/palette-store'

    switch resource
      when 'interactiveState'
        if action is 'get'
          log.info 'Received saveState request from CODAP.'
          callback
            success: true
            state: @graphStore.serialize paletteManager.store.palette
      when 'UndoChangeNotice'
        if operation is 'undoAction'
          log.info 'Received undoAction request from CODAP.'
          successes = @graphStore.undo(true)
          callback
            success: @reduceSuccesses(successes) isnt false
        if operation is 'redoAction'
          log.info 'Received redoAction request from CODAP.'
          successes = @graphStore.redo(true)
          callback
            success: @reduceSuccesses(successes) isnt false
        if operation is 'clearUndo'
          log.info 'Received clearUndo request from CODAP.'
          @graphStore.undoRedoManager.clearHistory()
        if operation is 'clearRedo'
          log.info 'Received clearRedo request from CODAP.'
          @graphStore.undoRedoManager.clearRedo()
      else
        log.info 'Unknown request received from CODAP: ' + JSON.stringify cmd


    # switch operation

    #   when 'externalUndoAvailable'
    #     log.info 'Received externalUndoAvailable request from CODAP.'
    #     CodapActions.hideUndoRedo()

    #   when 'standaloneUndoModeAvailable'
    #     log.info 'Received standaloneUndoModeAvailable request from CODAP.'
    #     @standaloneMode = true
    #     @graphStore.setCodapStandaloneMode true



  # undo/redo events can return an array of successes
  # this reduces that array to true iff every element is not explicitly false
  reduceSuccesses: (successes) ->
    return successes unless successes?.length        # return successes unless it's a non-zero length array
    return false for s in successes when s is false  # return false if we encounter *any* explicit false values in the array
    return true

  initGameHandler: (result) ->
    if result and result.success
      CodapActions.codapLoaded()

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
