IframePhoneRpcEndpoint = (require 'iframe-phone').IframePhoneRpcEndpoint
tr = require '../utils/translate'
CodapActions    = require '../actions/codap-actions'
undoRedoUIActions = (require '../stores/undo-redo-ui-store').actions
SimulationStore = require '../stores/simulation-store'
TimeUnits       = require '../utils/time-units'

module.exports = class CodapConnect

  @instances: {} # map of context -> instance

  @instance: (context) ->
    CodapConnect.instances[context] ?= new CodapConnect context
    CodapConnect.instances[context]

  constructor: (context) ->
    log.info 'CodapConnect: initializing'
    GraphStore = require '../stores/graph-store'
    @standaloneMode = false
    @queue = []
    @graphStore = GraphStore.store
    @lastTimeSent = @_timeStamp()
    @sendThrottleMs = 300

    SimulationStore.actions.recordingFramesCreated.listen  @addData.bind(@)

    CodapActions.sendUndoToCODAP.listen @_sendUndoToCODAP.bind(@)
    CodapActions.sendRedoToCODAP.listen @_sendRedoToCODAP.bind(@)


    @codapPhone = new IframePhoneRpcEndpoint( @codapRequestHandler,
      'data-interactive', window.parent )

    # load any previous data; also check if CODAP's undo is available,
    # or if we are in standalone mode.
    @codapPhone.call([
      {
        action: 'get',
        resource: 'interactiveFrame'
      },
      {
        action: 'get',
        resource: 'dataContext'
      }
    ], (ret) =>
      if ret
        frame   = ret[0]
        context = ret[1]

        @graphStore.setUsingCODAP true

        if frame?.values.externalUndoAvailable
          CodapActions.hideUndoRedo()
        else if frame?.values.standaloneUndoModeAvailable
          @standaloneMode = true
          @graphStore.setCodapStandaloneMode true

        # We check for game state in either the frame (CODAP API 2.0) or the dataContext
        # (API 1.0). We ignore the dataContext if we find game state in the interactiveFrame
        state = frame?.values.savedState or
                context?.values?.contextStorage?.gameState

        if state?
          @graphStore.deleteAll()
          @graphStore.loadData state
      else
        log.info "null response in codap-connect codapPhone.call"
    )


    # check if we already have a datacontext (if we're opening a saved model).
    # if we don't create one with our collections. Then kick off init
    @codapPhone.call
      action: 'get',
      resource: 'dataContext[Sage Simulation]'
    , (ret) =>
      # ret==null is indication of timeout, not an indication that the data set
      # doesn't exist.
      if !ret or ret.success
        @initGameHandler ret
      else
        @_createDataContext()


  _createDataContext: ->
    sampleDataAttrs = @_getSampleAttributes()
    message =
        action: 'create'
        resource: 'dataContext'
        values:
          name: 'Sage Simulation'
          title: 'Sage Simulation'
          collections:[
            {
              name: 'Simulation'
              title: 'Sage Simulation'
              labels:
                singleCase: 'run'
                pluralCase: 'runs'
              attrs: [
                name: tr '~CODAP.SIMULATION.EXPERIMENT'
                type: 'categorical'
              ]
            },
            {
              parent: "Simulation"
              name: 'Samples'
              title: 'Samples'
              labels:
                singleCase: 'sample'
                pluralCase: 'samples'
              attrs:  sampleDataAttrs
            }
          ]

    @codapPhone.call(message, @initGameHandler)


  # Return the column headings and types for our samples. (steps, NodeA, nodeB, nodeC)
  _getSampleAttributes: ->
    nodes = @graphStore.getNodes()

    # First column definition is the time index
    timeUnit = TimeUnits.toString SimulationStore.store.stepUnits(), true
    sampleDataAttrs = [
      {
        name: timeUnit
        type: "numeric"
      }
    ]

    addNodeAttr = (node) ->
      type = if node.valueDefinedSemiQuantitatively then 'qualitative' else 'numeric'
      sampleDataAttrs.push
        name: node.title
        type: type

    _.each nodes, (node) ->
      addNodeAttr(node)

    return sampleDataAttrs


  # If CODAPs Samples collection doesn't have all our data attributes add the new ones.
  _createMissingDataAttributes: (callback) ->
    # TODO: Computing this every time is expensive. Use a flag set from GraphChange event?
    currentAttributes = _.sortBy(@_getSampleAttributes(), 'name')
    attributesKey = _.pluck(currentAttributes,'name').join("|")
    if @attributesKey == attributesKey
      callback() if callback
    else
      doResolve = (listAttributeResponse) =>
        if listAttributeResponse.success
          values = listAttributeResponse.values
          newAttributes = _.select currentAttributes, (a) -> (! _.includes(values,a.name))
          message =
            action: 'create'
            resource: 'dataContext[Sage Simulation].collection[Samples].attribute'
            values: newAttributes
          @codapPhone.call message, (response) =>
            if response.success
              @attributesKey = attributesKey
              callback() if callback
            else
              log.info "Unable to update Attributes"
        else
          log.info "unable to list attributes"

      getListing =
        action: 'get'
        resource: 'dataContext[Sage Simulation].collection[Samples].attributeList'
      @codapPhone.call(getListing, doResolve)
      log.info "requested list of attributes"


  _timeStamp: ->
    new Date().getTime()


  _shouldSend: ->
    currentTime = @_timeStamp()
    elapsedTime = currentTime - @lastTimeSent
    return elapsedTime > @sendThrottleMs


  _sendSimulationData: ->
    # drain the queue synchronously. Re-add pending data in case of error.
    sampleData = @queue
    @queue = []

    createItemsMessage =
      action: 'create',
      resource: "dataContext[Sage Simulation].item",
      values: sampleData

    if sampleData.length > 0
      @createTable()
      @_createMissingDataAttributes =>
        # Send the data, if any
        createItemsCallback = (newSampleResult) =>
          if newSampleResult.success
            @lastTimeSent = @_timeStamp()
          else
            log.info "CODAP returned an error on 'create item''"
            # Re-add pending data in case of error.
            @queue = sampleData.concat @queue
        @codapPhone.call(createItemsMessage, createItemsCallback)


  _sendUndoToCODAP: ->
    @codapPhone.call
      action: 'notify',
      resource: 'undoChangeNotice'
      values: {
        operation: if @standaloneMode then 'undoButtonPress' else 'undoAction'
      }, (response) ->
        if (response?.values?.canUndo? && response?.values?.canRedo?)
          undoRedoUIActions.setCanUndoRedo response.values.canUndo, response.values.canRedo

  _sendRedoToCODAP: ->
    @codapPhone.call
      action: 'notify',
      resource: 'undoChangeNotice'
      values: {
        operation: if @standaloneMode then 'redoButtonPress' else 'redoAction'
      }, (response) ->
        if (response?.values?.canUndo? && response?.values?.canRedo?)
          undoRedoUIActions.setCanUndoRedo response.values.canUndo, response.values.canRedo

  sendUndoableActionPerformed: (logMessage) ->
    @codapPhone.call
      action: 'notify',
      resource: 'undoChangeNotice'
      values: {
        operation: 'undoableActionPerformed',
        logMessage: logMessage
      }, (response) ->
        if (response?.values?.canUndo? && response?.values?.canRedo?)
          undoRedoUIActions.setCanUndoRedo response.values.canUndo, response.values.canRedo

  addData: (data) ->
    timeUnit = TimeUnits.toString SimulationStore.store.stepUnits(), true
    # Create the sample data values (node values array)
    sampleData = _.map data, (frame) ->
      sample = {}
      sample[tr '~CODAP.SIMULATION.EXPERIMENT'] = SimulationStore.store.settings.experimentNumber
      sample[timeUnit] = frame.time
      _.each frame.nodes, (n) -> sample[n.title] = n.value
      sample
    @queue = @queue.concat sampleData

    if @_shouldSend()
      @_sendSimulationData()
    else
      setTimeout(@_sendSimulationData.bind(@), @sendThrottleMs)

  createGraph: (yAttributeName) ->
    @_createMissingDataAttributes()
    timeUnit = TimeUnits.toString SimulationStore.store.stepUnits(), true

    @codapPhone.call
      action: 'create',
      resource: 'component',
      values:
        type: 'graph'
        xAttributeName: timeUnit
        yAttributeName: yAttributeName
        size: { width: 242, height: 221 }
        position: 'bottom'
        enableNumberToggle: true

  createTable: ->
    unless @tableCreated
      @codapPhone.call
        action: 'create',
        resource: 'component',
        values:
          type: 'caseTable'
      @tableCreated = true

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
      when 'undoChangeNotice'
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
        # update undo/redo UI state based on CODAP undo/redo UI state
        if (cmd.values?.canUndo? and cmd.values?.canRedo?)
          undoRedoUIActions.setCanUndoRedo cmd.values?.canUndo, cmd.values?.canRedo
      else
        log.info 'Unknown request received from CODAP: ' + JSON.stringify cmd



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
      @codapPhone.call { action: action, args: args }, (reply) ->
        if callback
          callback reply
        if reply and reply.success
          resolve reply
        else
          reject 'CODAP request error'
    promise
