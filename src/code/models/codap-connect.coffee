IframePhoneRpcEndpoint = (require 'iframe-phone').IframePhoneRpcEndpoint
tr = require '../utils/translate'
CodapActions    = require '../actions/codap-actions'
undoRedoUIActions = (require '../stores/undo-redo-ui-store').actions
SimulationStore = require '../stores/simulation-store'
TimeUnits       = require '../utils/time-units'
escapeRegExp = (require '../utils/escape-reg-ex').escapeRegExp
# log -- see loglevel in package.json

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

    @dataContextName = "Sage Simulation"
    @simulationCollectionName = "Simulation"
    @samplesCollectionName = "Samples"

    @defaultExperimentName = "ExpNo"
    SimulationStore.actions.recordingFramesCreated.listen  @addData.bind(@)

    CodapActions.sendUndoToCODAP.listen @_sendUndoToCODAP.bind(@)
    CodapActions.sendRedoToCODAP.listen @_sendRedoToCODAP.bind(@)


    @codapPhone = new IframePhoneRpcEndpoint( @codapRequestHandler,
      'data-interactive', window.parent )

    # load any previous data; also check if CODAP's undo is available,
    # or if we are in standalone mode.
    @codapPhone.call([
      {
        action: 'update'
        resource: 'interactiveFrame'
        values: {
          title: tr "~CODAP.INTERACTIVE_FRAME.TITLE"
          preventBringToFront: true,
          cannotClose: true
        }
      },
      {
        action: 'get'
        resource: 'interactiveFrame'
      },
      {
        action: 'get'
        resource: 'dataContext'
      }
    ], (ret) =>
      if ret
        frame   = ret[1]
        context = ret[2]

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
          @_initialSyncAttributeProperties null, true
      else
        log.info "null response in codap-connect codapPhone.call"
    )


    # check if we already have a datacontext (if we're opening a saved model).
    # if we don't create one with our collections. Then kick off init
    @codapPhone.call
      action: 'get',
      resource: "dataContext[#{@dataContextName}]"
    , (ret) =>
      # ret==null is indication of timeout, not an indication that the data set
      # doesn't exist.
      if !ret or ret.success
        if (attrs = ret?.values?.collections?[1]?.attrs?)
          @_initialSyncAttributeProperties attrs
      else
        @_createDataContext()
      @updateExperimentColumn()
      @_getExperimentNumber()

  # initial synchronization; primarily used for synchronizing legacy documents
  _initialSyncAttributeProperties: (attrs, isLoaded) ->
    @_attrsToSync = attrs if attrs
    @_attrsAreLoaded = isLoaded if isLoaded
    if @_attrsToSync and @_attrsAreLoaded
      @_syncAttributeProperties @_attrsToSync, true
      @_attrsToSync = null


  _createDataContext: ->
    sampleDataAttrs = @_getSampleAttributes()
    message =
        action: 'create'
        resource: 'dataContext'
        values:
          name: @dataContextName
          title: @dataContextName
          collections:[
            {
              name: @simulationCollectionName
              title: 'Sage Simulation'
              labels:
                singleCase: 'run'
                pluralCase: 'runs'
              attrs: [
                name: @defaultExperimentName
                type: 'categorical'
              ]
            },
            {
              parent: @simulationCollectionName
              name: @samplesCollectionName
              title: @samplesCollectionName
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
        name: node.codapName or node.title
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
        if listAttributeResponse?.success
          values = listAttributeResponse.values
          newAttributes = _.select currentAttributes, (a) -> (! _.includes(values,a.name))
          message =
            action: 'create'
            resource: "dataContext[#{@dataContextName}].collection[#{@samplesCollectionName}].attribute"
            values: newAttributes
          @codapPhone.call message, (response) =>
            if response.success
              if (response.values?.attrs?)
                @_syncAttributeProperties response.values.attrs, true
              @attributesKey = attributesKey
              callback() if callback
            else
              log.info "Unable to update Attributes"
        else
          log.info "unable to list attributes"

      getListing =
        action: 'get'
        resource: "dataContext[#{@dataContextName}].collection[#{@samplesCollectionName}].attributeList"
      @codapPhone.call(getListing, doResolve)
      log.info "requested list of attributes"

  _syncAttributeProperties: (attrProps, initialSync) ->
    nodesToSync = if initialSync \
                    then _.filter @graphStore.nodeKeys, (node) -> not node.codapID or not node.codapName \
                    else _.map @graphStore.nodeKeys, (node) -> node # map nodeKeys to array of nodes
    if nodesToSync?.length
      _.each attrProps, (attr) =>
        # check for id match
        node = _.find nodesToSync, (node) -> node.codapID is attr.id
        # check for clientName match
        if not node and attr.clientName
          node = _.find nodesToSync, (node) -> node.title is attr.clientName
        # check for codapName match
        if not node and attr.name
          node = _.find nodesToSync, (node) -> node.codapName is attr.name
        # check for title match; use RegEx to match '_' as wildcard character
        if not node and attr.name
          nameRegEx = new RegExp("^#{escapeRegExp (attr.name.replace /_/g, '?')}$")
          node = _.find nodesToSync, (node) -> nameRegEx.test node.title
        if node
          # sync id and name
          if not node.codapID or not node.codapName
            node.codapID = attr.id if not node.codapID
            node.codapName = attr.name
          # sync name/title, but only if it's changed on the CODAP side
          else if node.codapName isnt attr.name
            node.codapName = attr.name
            if not initialSync and (node.title isnt attr.name)
              @graphStore._changeNode node, { title: attr.name }, false
          if initialSync
            _.remove nodesToSync, (node) -> node.codapID and node.codapName
          else
            _.remove nodesToSync, (node) -> node.codapID is attr.id
        if not nodesToSync?.length
          false # terminate iteration if all nodes are synced

  sendRenameAttribute: (nodeKey, prevTitle) ->
    node = @graphStore.nodeKeys[nodeKey]
    codapKey = node.codapID or node.codapName or prevTitle
    if codapKey
      message =
        action: 'update'
        resource: "dataContext[#{@dataContextName}].collection[#{@samplesCollectionName}].attribute[#{codapKey}]"
        values: { name: node.title }
        meta:
          dirtyDocument: false
      @codapPhone.call message, (response) =>
        if response.success
          if response?.values?.attrs
            @_syncAttributeProperties response.values.attrs
        else if node.codapID and node.codapName
          log.warn "Error: CODAP attribute rename failed!"



  # updateExperimentColumn
  #
  # At the time of document creation in CODAP we don't always know
  # the final language the document is going to be rendered in. For
  # example, An author sets up a CODAP document with Sage, and some
  # other CODAP plugins. Next, they make copies of this document for
  # several languages. Regardless of the author's language setting,
  # the experiment number column has the un-localized label. Later
  # when an i18 user collects experiment data for the first time, we
  # then rename the column from the default to that user's language.
  # We could partially avoid this if data CODAP table attributes
  # supported `titles` for localized names.
  updateExperimentColumn: ->
    experimentNumberLabel = tr '~CODAP.SIMULATION.EXPERIMENT'
    handleSimulationAttributes = (listAttributeResponse) =>
      if listAttributeResponse?.success
        values = _.pluck(listAttributeResponse.values, 'name')
        if not _.includes(values, experimentNumberLabel)
          if _.includes(values, @defaultExperimentName)
            @renameExperimentNumberColumn experimentNumberLabel
          else
            @createExperimentNumberColumn experimentNumberLabel
      else
        log.warn "CODAP: unable to list Simulation attributes"

    getListing =
      action: 'get'
      resource: "dataContext[#{@dataContextName}].collection[#{@simulationCollectionName}].attributeList"
    @codapPhone.call(getListing, handleSimulationAttributes)

  createExperimentNumberColumn: (label) ->
    experimentAttributes =
      name: label
      type: 'categorical'
    message =
      action: 'create'
      resource: "dataContext[#{@dataContextName}].collection[#{@simulationCollectionName}].attribute"
      values: [ experimentAttributes ]
    @codapPhone.call message, (response) ->
      if response.success
        log.info "created attribute #{label}"
      else
        log.warn "Unable to create attribute #{label}"

  renameExperimentNumberColumn: (label) ->
    @renameSimulationProperty(@defaultExperimentName, label)

  renameSimulationProperty: (oldValue, newValue) ->
    message =
      action: 'update'
      resource: "dataContext[#{@dataContextName}].collection[#{@simulationCollectionName}].attribute[#{oldValue}]"
      values: { name: newValue }
      meta:
        dirtyDocument: false
    @codapPhone.call message, (response) ->
      if response.success
        log.info "Renamed Simulation attribute: #{oldValue} → #{newValue}"
      else
        log.info "CODAP rename Simulation attribute failed!"

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
      resource: "dataContext[#{@dataContextName}].item",
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
        dataContext: @dataContextName
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
          dataContext: @dataContextName
      @tableCreated = true

  codapRequestHandler: (cmd, callback) =>
    resource = cmd.resource
    action = cmd.action
    # if we have an array of changes, for now just extract the first one
    change = if Array.isArray cmd.values then cmd.values[0] else cmd.values
    operation = change?.operation
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
      when 'dataContextChangeNotice[Sage Simulation]'
        if operation is 'updateAttributes'
          if change?.result?.attrs
            @_syncAttributeProperties change.result.attrs
      else
        log.info 'Unhandled request received from CODAP: ' + JSON.stringify cmd

  # undo/redo events can return an array of successes
  # this reduces that array to true iff every element is not explicitly false
  reduceSuccesses: (successes) ->
    return successes unless successes?.length        # return successes unless it's a non-zero length array
    return false for s in successes when s is false  # return false if we encounter *any* explicit false values in the array
    return true

  # Get the experiment-number of the last case in CODAP, and set the simulation store
  # to the next experiment number. This is only called in the case where we found an
  # existing data context in CODAP.
  _getExperimentNumber: (result) ->
    runsCollection = "dataContext[#{@dataContextName}].collection[#{@simulationCollectionName}]"
    # find out how many cases there are
    @codapPhone.call
      action: 'get',
      resource: "#{runsCollection}.caseCount"
    , (ret) =>
      if ret?.success
        caseCount = ret.values
        if caseCount > 0
          # get last case, and find its number
          @codapPhone.call
            action: 'get',
            resource: "#{runsCollection}.caseByIndex[#{caseCount-1}]"
          , (ret2) ->
            if ret2?.success
              lastCase = ret2.values['case']
              lastExperimentNumber = parseInt(lastCase.values[tr '~CODAP.SIMULATION.EXPERIMENT'], 10) || 0
              SimulationStore.actions.setExperimentNumber lastExperimentNumber + 1

      @initGameHandler ret

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
