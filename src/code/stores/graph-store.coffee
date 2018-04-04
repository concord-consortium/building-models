Importer            = require '../utils/importer'
Link                = require '../models/link'
NodeModel           = require '../models/node'
TransferModel       = require '../models/transfer'
UndoRedo            = require '../utils/undo-redo'
SelectionManager    = require '../models/selection-manager'
PaletteStore        = require "../stores/palette-store"
tr                  = require "../utils/translate"
Migrations          = require "../data/migrations/migrations"
PaletteDeleteStore  = require "../stores/palette-delete-dialog-store"
AppSettingsStore    = require "../stores/app-settings-store"
SimulationStore     = require "../stores/simulation-store"
GraphActions        = require "../actions/graph-actions"
CodapActions        = require '../actions/codap-actions'
InspectorPanelStore = require "../stores/inspector-panel-store"
CodapConnect        = require '../models/codap-connect'
RelationFactory     = require "../models/relation-factory"
DEFAULT_CONTEXT_NAME = 'building-models'

GraphStore  = Reflux.createStore
  init: (context) ->
    @linkKeys           = {}
    @nodeKeys           = {}
    @loadListeners      = []
    @filename           = null
    @filenameListeners  = []

    @undoRedoManager    = UndoRedo.instance debug:false, context:context
    @selectionManager   = new SelectionManager()
    PaletteDeleteStore.store.listen @paletteDelete.bind(@)

    SimulationStore.actions.createExperiment.listen        @resetSimulation.bind(@)
    SimulationStore.actions.setDuration.listen             @resetSimulation.bind(@)
    SimulationStore.actions.capNodeValues.listen           @resetSimulation.bind(@)
    SimulationStore.actions.simulationFramesCreated.listen @updateSimulationData.bind(@)

    @usingCODAP = false
    @codapStandaloneMode = false

    @lastRunModel = ""   # string description of the model last time we ran simulation

  resetSimulation: ->
    for node in @getNodes()
      node.frames = []
    @updateListeners()

  _trimSimulation: ->
    for node in @getNodes()
      # leaving some excess data reduces flicker during rapid changes
      excessFrames = node.frames.length - 2 * SimulationStore.store.simulationDuration()
      if excessFrames > 0
        node.frames.splice(0, excessFrames)
    return  # prevent unused default return value

  updateSimulationData: (data) ->
    nodes = @getNodes()
    for frame in data
      for node, i in frame.nodes
        nodes[i]?.frames.push node.value
    return  # prevent unused default return value

  paletteDelete: (status) ->
    {deleted,paletteItem,replacement} = status
    if deleted and paletteItem and replacement
      for node in @getNodes()
        if node.paletteItemIs paletteItem
          @changeNode({image: replacement.image, paletteItem: replacement.uuid},node)
    return  # prevent unused default return value

  # This and redo() can be called from three sources, and we can be in two different
  # modes. It can be called from the 1) button press, 2) keyboard, and 3) CODAP action.
  # We can be in CODAP standalone mode or not.
  #
  # The undoRedoManager should handle the undo/redo when EITHER we are not running
  # in CODAP or the undo/redo has been initiated from CODAP
  #
  # CODAP should handle the undo/redo when we are running from CODAP in either
  # standalone or non-standalone mode and CODAP did not initiate the request
  undo: (fromCODAP) ->
    if fromCODAP or not @usingCODAP
      @undoRedoManager.undo()
    else
      CodapActions.sendUndoToCODAP()

  redo: (fromCODAP) ->
    if fromCODAP or not @usingCODAP
      @undoRedoManager.redo()
    else
      CodapActions.sendRedoToCODAP()

  setSaved: ->
    @undoRedoManager.save()

  revertToOriginal: ->
    @undoRedoManager.revertToOriginal()

  revertToLastSave: ->
    @undoRedoManager.revertToLastSave()

  setUsingCODAP: (@usingCODAP) ->

  setCodapStandaloneMode: (@codapStandaloneMode) ->

  addChangeListener: (listener) ->
    log.info("adding change listener")
    @undoRedoManager.addChangeListener listener

  addFilenameListener: (listener) ->
    log.info("adding filename listener #{listener}")
    @filenameListeners.push listener

  setFilename: (filename) ->
    @filename = filename
    for listener in @filenameListeners
      listener filename

  getLinks: ->
    (value for key, value of @linkKeys)

  getNodes: ->
    (value for key, value of @nodeKeys)

  hasLink: (link) ->
    @linkKeys[link.terminalKey()]?

  hasNode: (node) ->
    @nodeKeys[node.key]?

  importLink: (linkSpec) ->
    sourceNode = @nodeKeys[linkSpec.sourceNode]
    targetNode = @nodeKeys[linkSpec.targetNode]
    transferNode = @nodeKeys[linkSpec.transferNode] if linkSpec.transferNode
    linkSpec.sourceNode = sourceNode
    linkSpec.targetNode = targetNode
    linkSpec.transferNode = transferNode if transferNode
    link = new Link(linkSpec)
    @addLink(link)
    link

  addLink: (link) ->
    @endNodeEdit()
    @undoRedoManager.createAndExecuteCommand 'addLink',
      execute: => @_addLink link
      undo: => @_removeLink link

  _addLink: (link) ->
    unless link.sourceNode is link.targetNode or @hasLink link
      @linkKeys[link.terminalKey()] = link
      @nodeKeys[link.sourceNode.key].addLink(link)
      @nodeKeys[link.targetNode.key].addLink(link)
    @_graphUpdated()
    @updateListeners()


  removeLink: (link) ->
    @endNodeEdit()
    @undoRedoManager.createAndExecuteCommand 'removeLink',
      execute: =>
        @_removeLink link
        @_removeTransfer link if link.transferNode?
      undo: =>
        @_addTransfer link if link.transferNode?
        @_addLink link

  _removeLink: (link) ->
    delete @linkKeys[link.terminalKey()]
    @nodeKeys[link.sourceNode.key]?.removeLink(link)
    @nodeKeys[link.targetNode.key]?.removeLink(link)
    @_graphUpdated()
    @updateListeners()

  isUniqueTitle: (title, skipNode, nodes=@getNodes()) ->
    nonUniqueNode = (otherNode) ->
      sameTitle = otherNode.title is title
      if skipNode then sameTitle and otherNode isnt skipNode else sameTitle
    not _.find nodes, nonUniqueNode

  ensureUniqueTitle: (node, newTitle=node.title) ->
    nodes = @getNodes()
    if not @isUniqueTitle newTitle, node, nodes
      index = 2
      endsWithNumber = / (\d+)$/
      matches = newTitle.match(endsWithNumber)
      if matches
        index = parseInt(matches[1], 10) + 1
        newTitle = newTitle.replace(endsWithNumber, '')
      template = "#{newTitle} %{index}"
      loop
        newTitle = tr template, {index: index++}
        break if @isUniqueTitle newTitle, node, nodes
    newTitle

  addNode: (node) ->
    @endNodeEdit()
    node.title = @ensureUniqueTitle node
    @undoRedoManager.createAndExecuteCommand 'addNode',
      execute: => @_addNode node
      undo: => @_removeNode node

  removeNode: (nodeKey) ->
    @endNodeEdit()
    node = @nodeKeys[nodeKey]
    transferRelation = node.transferLink?.relation

    # create a copy of the list of links
    links = node.links.slice()
    # identify any transfer nodes that need to be removed as well
    transferLinks = []
    _.each(links, (link) ->
      if link?.transferNode?.key?
        transferLinks.push link
    )

    @undoRedoManager.createAndExecuteCommand 'removeNode',
      execute: =>
        node.transferLink?.relation = node.transferLink.defaultRelation()
        @_removeLink(link) for link in links
        @_removeTransfer(link) for link in transferLinks
        @_removeNode node
      undo: =>
        node.transferLink?.relation = transferRelation
        @_addNode node
        @_addTransfer(link) for link in transferLinks
        @_addLink(link) for link in links

  _addNode: (node) ->
    unless @hasNode node
      @nodeKeys[node.key] = node
      @_graphUpdated()
      # add variable to CODAP
      CodapConnect.instance(DEFAULT_CONTEXT_NAME)._createMissingDataAttributes()
      @updateListeners()

  _removeNode: (node) ->
    delete @nodeKeys[node.key]
    @_graphUpdated()
    @updateListeners()

  _addTransfer: (link) ->
    unless link.transferNode?
      source = link.sourceNode
      target = link.targetNode
      link.transferNode = new TransferModel
        x: source.x + ((target.x - source.x) / 2)
        y: source.y + ((target.y - source.y) / 2)
      link.transferNode.setTransferLink link
    @_addNode link.transferNode

  _removeTransfer: (tLink) ->
    transfer = tLink.transferNode
    return unless transfer

    links = @getLinks()
    _.each links, (link) =>
      if link.sourceNode is transfer or link.targetNode is transfer
        @removeLink link
    @_removeNode transfer

  _graphUpdated: ->
    node.checkIsInIndependentCycle() for key, node of @nodeKeys

  moveNodeCompleted: (nodeKey, leftDiff, topDiff) ->
    @endNodeEdit()
    @undoRedoManager.createAndExecuteCommand 'moveNode',
      execute: => @moveNode nodeKey, 0, 0
      undo: => @moveNode nodeKey, -leftDiff, -topDiff
      redo: => @moveNode nodeKey, leftDiff, topDiff

  moveNode: (nodeKey, leftDiff, topDiff) ->
    node = @nodeKeys[nodeKey]
    return unless node
    # alert "moveNode:" + nodeKey + " " + node.x + " "
    # console.log "moveNode:", node, leftDiff,  topDiff
    node.x = node.x + leftDiff
    node.y = node.y + topDiff
    @updateListeners()

  selectedNodes: ->
    @selectionManager.getNodeInspection() or [] # add or [] into getNodeInspection() ?

  selectedLinks: ->
    @selectionManager.getLinkInspection() or [] # add or [] into getLinkInspection() ?

  editingNode: ->
    @selectionManager.selection(SelectionManager.NodeTitleEditing)[0] or null

  editNode: (nodeKey) ->
    @selectionManager.selectNodeForTitleEditing(@nodeKeys[nodeKey])

  selectNode: (nodeKey) ->
    @endNodeEdit()
    @selectionManager.selectNodeForInspection(@nodeKeys[nodeKey])


  _notifyNodeChanged: (node) ->
    @_maybeChangeSelectedItem node
    @updateListeners()

  changeNode: (data, node) ->
    _node = node or @selectedNodes()
    nodes = [].concat(_node) # force an array of nodes
    for node in nodes
      if node
        originalData =
          title: node.title
          image: node.image
          paletteItem: node.paletteItem
          color: node.color
          initialValue: node.initialValue
          value: node.value or node.initialValue
          min: node.min
          max: node.max
          isAccumulator: node.isAccumulator
          allowNegativeValues: node.allowNegativeValues
          combineMethod: node.combineMethod
          valueDefinedSemiQuantitatively: node.valueDefinedSemiQuantitatively

        nodeChanged = false
        for key of data
          if data.hasOwnProperty key
            if data[key] isnt originalData[key] then nodeChanged = true

        if nodeChanged        # don't do anything unless we've actually changed the node

          accumulatorChanged = data.isAccumulator? and \
                                (!!data.isAccumulator isnt !!originalData.isAccumulator)

          if accumulatorChanged
                            # all inbound links are invalidated
            changedLinks = [].concat(node.inLinks())
                            # along with outbound transfer links
                              .concat(_.filter(node.outLinks(), (link) ->
                                link.relation.type is 'transfer' or
                                link.relation.type is 'initial-value'))
            originalRelations = {}
            for link in changedLinks
              originalRelations[link.key] = link.relation

          @undoRedoManager.startCommandBatch()
          @undoRedoManager.createAndExecuteCommand 'changeNode',
            execute: =>
              if accumulatorChanged
                for link in changedLinks
                  @_changeLink link, { relation: link.defaultRelation() }
              @_changeNode node, data
            undo: =>
              @_changeNode node, originalData
              if accumulatorChanged
                for link in changedLinks
                  @_changeLink link, { relation: originalRelations[link.key] }
              return
          @undoRedoManager.endCommandBatch()

  _changeNode: (node, data, notifyCodap = true) ->
    log.info "Change for #{node.title}"
    for key in NodeModel.fields
      if data.hasOwnProperty key
        log.info "Change #{key} for #{node.title}"
        prev = node[key]
        node[key] = data[key]
        if key is 'title'
          if notifyCodap and @usingCODAP
            codapConnect = CodapConnect.instance DEFAULT_CONTEXT_NAME
            codapConnect.sendRenameAttribute node.key, prev
          @_maybeChangeTransferTitle node
    node.normalizeValues(_.keys(data))
    @_notifyNodeChanged(node)

  changeNodeProperty: (property, value, node) ->
    data = {}
    data[property] = value
    @changeNode(data, node)

  changeNodeWithKey: (key, data) ->
    node = @nodeKeys[ key ]
    if node
      @changeNode(data,node)

  startNodeEdit: ->
    @undoRedoManager.startCommandBatch("changeNode")

  endNodeEdit: ->
    @undoRedoManager.endCommandBatch()

  clickLink: (link, multipleSelectionsAllowed) ->
    # this is to allow both clicks and double clicks
    now = (new Date()).getTime()
    isDoubleClick = now - (@lastClickLinkTime || 0) <= 250
    @lastClickLinkTime = now
    clearTimeout @lastClickLinkTimeout

    if isDoubleClick
      @selectionManager.selectNodeForInspection(link.targetNode)
      InspectorPanelStore.actions.openInspectorPanel('relations', {link: link})
    else
      # set single click handler to run 250ms from now so we can wait to see if this is a double click
      singleClickHandler = =>
        if @selectionManager.isSelected(link)
          @selectionManager.selectLinkForTitleEditing(link)
        else
          @selectionManager.selectLinkForInspection(link, multipleSelectionsAllowed)
      @lastClickLinkTimeout = setTimeout singleClickHandler, 250

  editLink: (link) ->
    @selectionManager.selectLinkForTitleEditing(link)

  changeLink: (link, changes={}) ->
    if changes.deleted
      @removeSelectedLinks()
    else if link
      originalData =
        title: link.title
        color: link.color
        relation: link.relation
        reasoning: link.reasoning
      @undoRedoManager.startCommandBatch()
      @undoRedoManager.createAndExecuteCommand 'changeLink',
        execute: => @_changeLink link,  changes
        undo: => @_changeLink link, originalData
      @undoRedoManager.endCommandBatch()

  _maybeChangeSelectedItem: (item) ->
    # TODO: This is kind of hacky:
    if @selectionManager.isSelected(item)
      @selectionManager._notifySelectionChange()

  _maybeChangeRelation: (link, relation) ->
    if relation and relation.isTransfer
      @_addTransfer link
    else
      @_removeTransfer link

  _maybeChangeTransferTitle: (changedNode) ->
    for key, node of @nodeKeys
      transferLink = node.transferLink
      if transferLink and ((transferLink.sourceNode is changedNode) or (transferLink.targetNode is changedNode))
        @changeNodeWithKey(key, {title: node.computeTitle()})

  _changeLink: (link, changes) ->
    log.info "Change  for #{link.title}"
    for key in ['title','color', 'relation', 'reasoning']
      if changes[key]?
        log.info "Change #{key} for #{link.title}"
        link[key] = changes[key]
    @_maybeChangeRelation link, changes.relation
    @_maybeChangeSelectedItem link
    @_graphUpdated()
    @updateListeners()

  _nameForNode: (node) ->
    @nodeKeys[node]

  newLinkFromEvent: (info) ->
    newLink = {}
    startKey = $(info.source).data('node-key') or 'undefined'
    endKey   = $(info.target).data('node-key') or 'undefined'
    startTerminal = if info.connection.endpoints[0].anchor.type is "Top" then "a" else "b"
    endTerminal   = if info.connection.endpoints[1].anchor.type is "Top" then "a" else "b"
    @importLink
      sourceNode:startKey,
      targetNode:endKey,
      sourceTerminal: startTerminal,
      targetTerminal: endTerminal,
      color: info.color,
      title: info.title
    true

  deleteAll: ->
    for node of @nodeKeys
      @removeNode node
    @setFilename 'New Model'
    @undoRedoManager.clearHistory()

  removeSelectedNodes: ->
    selectedNodeKeys = (node.key for node in @selectedNodes())
    for nodeKey in selectedNodeKeys
      @removeNode nodeKey

  removeSelectedLinks: ->
    for selectedLink in @selectedLinks()
      @removeLink selectedLink

  deleteSelected: ->
    log.info "Deleting selected items"
    # deleting multiple links/nodes should be undoable as a single action
    @undoRedoManager.startCommandBatch()
    @removeSelectedLinks()
    @removeSelectedNodes()
    @undoRedoManager.endCommandBatch()
    @selectionManager.clearSelection()

  removeLinksForNode: (node) ->
    @removeLink(link) for link in node.links

  # getDescription returns one or more easily-comparable descriptions of the graph's
  # state, customized for different applications (e.g. deciding whether to redraw links),
  # while only looping through the nodes and links once.
  #
  # links: link terminal locations, and link formula (for stroke style), plus number of nodes
  #         e.g. "10,20;1 * in;50,60|" for each link
  # model: description of each link relationship and the values of its terminal nodes
  #         e.g. "node-0:50;1 * in;node-1:50|" for each link
  #
  # We pass nodes and links so as not to calculate @getNodes and @getLinks redundantly.
  getDescription: (nodes, links) ->
    settings = SimulationStore.store.settings

    linkDescription = ""
    modelDescription = "steps:#{settings.duration}|cap:#{settings.capNodeValues}|"

    _.each links, (link) ->
      return unless (source = link.sourceNode) and (target = link.targetNode)
      linkDescription += "#{source.x},#{source.y};"
      linkDescription += link.relation.formula + ";"
      linkDescription += "#{target.x},#{target.y}|"

      if link.relation.isDefined
        isCappedAccumulator = source.isAccumulator and not source.allowNegativeValues
        capValue = if isCappedAccumulator then ':cap' else ''
        modelDescription += "#{source.key}:#{source.initialValue}#{capValue};"
        modelDescription += link.relation.formula + ";"
        if link.relation.type is 'transfer'
          transfer = link.transferNode
          modelDescription += "#{transfer.key}:#{transfer.initialValue}:#{transfer.combineMethod};" if transfer
        modelDescription += "#{target.key}#{if target.isAccumulator then ':'+(target.value ? target.initialValue) else ''}|"

    linkDescription += nodes.length     # we need to redraw targets when new node is added

    return {
      links: linkDescription
      model: modelDescription
    }

  # Returns the minimum simulation type that the current graph allows.
  # Returns
  #   0 (diagramOnly)    if there are no defined relationships
  #   1 (static)         if there are no collectors
  #   2 (time)           if there are collectors
  getMinimumSimulationType: ->
    minSimulationType = AppSettingsStore.store.SimulationType.diagramOnly

    links = @getLinks()
    for link in links
      continue unless (source = link.sourceNode) and (target = link.targetNode)

      if source.isAccumulator or target.isAccumulator
        # we know we have to be time-based
        return AppSettingsStore.store.SimulationType.time
      else if link.relation?.formula
        # we have a defined relationship, so we know we'll be at least 1
        minSimulationType = AppSettingsStore.store.SimulationType.static

    return minSimulationType

  # Returns the minimum complexity that the current graph allows.
  # Returns
  #   0 (basic)          if there are no defined relationships, or all scalars are `about the same`
  #   1 (expanded)       otherwise
  getMinimumComplexity: ->
    links = @getLinks()
    for link in links
      continue unless (source = link.sourceNode) and (target = link.targetNode)

      if link.relation?.formula
        relation = RelationFactory.selectionsFromRelation(link.relation)
        if relation.scalar and relation.scalar.id isnt "aboutTheSame"
          return AppSettingsStore.store.Complexity.expanded

    return AppSettingsStore.store.Complexity.basic

  loadData: (data) ->
    log.info "json success"
    importer = new Importer(@, AppSettingsStore.store, PaletteStore)
    importer.importData(data)
    @undoRedoManager.clearHistory()

  loadDataFromUrl: (url) =>
    log.info("loading local data")
    log.info("url " + url)
    $.ajax
      url: url,
      dataType: 'json',
      success: (data) =>
        @loadData data
      error: (xhr, status, err) ->
        log.error(url, status, err.toString())

  serialize: (palette) ->
    nodeExports = for key,node of @nodeKeys
      node.toExport()
    linkExports = for key,link of @linkKeys
      link.toExport()
    settings = AppSettingsStore.store.serialize()
    settings.simulation = SimulationStore.store.serialize()

    data =
      version: Migrations.latestVersion()
      filename: @filename
      palette: palette
      nodes: nodeExports
      links: linkExports
      settings: settings
    return data

  toJsonString: (palette) ->
    JSON.stringify @serialize palette

  getGraphState: ->
    nodes = @getNodes()
    links = @getLinks()
    description = @getDescription(nodes, links)

    {
      nodes
      links
      description
    }

  updateListeners: ->
    graphState = @getGraphState()
    GraphActions.graphChanged.trigger(graphState)

    if @lastRunModel != graphState.description.model
      @_trimSimulation()
      SimulationStore.actions.runSimulation()
      @lastRunModel = graphState.description.model
    return

mixin =
  getInitialState: ->
    GraphStore.getGraphState()

  componentDidMount: ->
    @subscriptions = []
    @subscriptions.push GraphActions.graphChanged.listen @onGraphChanged
    @subscriptions.push GraphActions.resetSimulation.listen @onResetSimulation

  componentWillUnmount: ->
    for unsubscribe in @subscriptions
      unsubscribe()

  onGraphChanged: (state) ->
    @setState state

    # TODO: not this:
    @diagramToolkit?.repaint()

  onResetSimulation: ->
    GraphStore.resetSimulation()


module.exports =
  # actions: GraphActions
  store: GraphStore
  mixin: mixin
