Importer            = require '../utils/importer'
Link                = require '../models/link'
NodeModel           = require '../models/node'
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

GraphStore  = Reflux.createStore
  init: (context) ->
    @linkKeys           = {}
    @nodeKeys           = {}
    @loadListeners      = []
    @filename           = null
    @filenameListeners  = []

    @undoRedoManager    = UndoRedo.instance debug:true, context:context
    @selectionManager   = new SelectionManager()
    PaletteDeleteStore.store.listen @paletteDelete.bind(@)

    SimulationStore.actions.resetSimulation.listen         @resetSimulation.bind(@)
    SimulationStore.actions.setDuration.listen             @resetSimulation.bind(@)
    SimulationStore.actions.simulationFramesCreated.listen @updateSimulationData.bind(@)

    @codapStandaloneMode = false

  resetSimulation: ->
    for node in @getNodes()
      node.frames = []
    @updateListeners()

  updateSimulationData: (data) ->
    nodes = @getNodes()
    for frame in data
      for node, i in frame.nodes
        nodes[i].frames.push node.value

    if AppSettingsStore.store.settings.showingMinigraphs
      @updateListeners()


  paletteDelete: (status) ->
    {deleted,paletteItem,replacement} = status
    if deleted and paletteItem and replacement
      for node in @getNodes()
        if node.paletteItemIs paletteItem
          @changeNode({image: replacement.image, paletteItem: replacement.uuid},node)

  # This and redo() can be called from three sources, and we can be in two different
  # modes. It can be called from the 1) button press, 2) keyboard, and 3) CODAP action.
  # We can be in CODAP standalone mode or not.
  #
  # We want to immediately execute the action if EITHER we are not in standalone mode
  # (for all sources), or if we are in standalone mode and the source is CODAP
  # (forced == true).
  #
  # If we are in standalone mode and the source was not CODAP, we want to send the
  # event to CODAP.
  undo: (forced) ->
    if forced or not @codapStandaloneMode
      @undoRedoManager.undo()
    else
      CodapActions.sendUndoToCODAP()

  redo: (forced) ->
    if forced or not @codapStandaloneMode
      @undoRedoManager.redo()
    else
      CodapActions.sendRedoToCODAP()

  setSaved: ->
    @undoRedoManager.save()

  revertToOriginal: ->
    @undoRedoManager.revertToOriginal()

  revertToLastSave: ->
    @undoRedoManager.revertToLastSave()

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
    linkSpec.sourceNode = sourceNode
    linkSpec.targetNode = targetNode
    link = new Link(linkSpec)
    @addLink(link)

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
      execute: => @_removeLink link
      undo: => @_addLink link

  _removeLink: (link) ->
    delete @linkKeys[link.terminalKey()]
    @nodeKeys[link.sourceNode.key]?.removeLink(link)
    @nodeKeys[link.targetNode.key]?.removeLink(link)
    @_graphUpdated()
    @updateListeners()


  addNode: (node) ->
    @endNodeEdit()
    @undoRedoManager.createAndExecuteCommand 'addNode',
      execute: => @_addNode node
      undo: => @_removeNode node

  removeNode: (nodeKey) ->
    @endNodeEdit()
    node = @nodeKeys[nodeKey]

    # create a copy of the list of links
    links = node.links.slice()

    @undoRedoManager.createAndExecuteCommand 'removeNode',
      execute: =>
        @_removeLink(link) for link in links
        @_removeNode node
      undo: =>
        @_addNode node
        @_addLink(link) for link in links

  _addNode: (node) ->
    unless @hasNode node
      @nodeKeys[node.key] = node
      @_graphUpdated()
      @updateListeners()

  _removeNode: (node) ->
    delete @nodeKeys[node.key]
    @_graphUpdated()
    @updateListeners()

  _graphUpdated: ->
    node.checkIsInIndependentCycle() for key, node of @nodeKeys

  moveNodeCompleted: (nodeKey, pos, originalPos) ->
    @endNodeEdit()
    node = @nodeKeys[nodeKey]
    return unless node
    @undoRedoManager.createAndExecuteCommand 'moveNode',
      execute: => @moveNode node.key, pos, originalPos
      undo: => @moveNode node.key, originalPos, pos

  moveNode: (nodeKey, pos, originalPos) ->
    node = @nodeKeys[nodeKey]
    return unless node
    node.x = pos.left
    node.y = pos.top
    @updateListeners()

  selectedNode: ->
    @selectionManager.selection(SelectionManager.NodeInspection)[0] or null

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
    node = node or @selectedNode()
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
        valueDefinedSemiQuantitatively: node.valueDefinedSemiQuantitatively


      nodeChanged = false
      for key of data
        if data.hasOwnProperty key
          if data[key] isnt originalData[key] then nodeChanged = true

      if nodeChanged        # don't do anything unless we've actually changed the node
        @undoRedoManager.createAndExecuteCommand 'changeNode',
          execute: => @_changeNode node, data
          undo: => @_changeNode node, originalData

  _changeNode: (node, data) ->
    log.info "Change for #{node.title}"
    for key in NodeModel.fields
      if data.hasOwnProperty key
        log.info "Change #{key} for #{node.title}"
        node[key] = data[key]
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

  clickLink: (link) ->
    if @selectionManager.isSelected(link)
      @selectionManager.selectLinkForTitleEditing(link)
    else
      @selectionManager.selectLinkForInspection(link)

  editLink: (link) ->
    @selectionManager.selectLinkForTitleEditing(link)

  changeLink: (link, changes={}) ->
    if changes.deleted
      @removeSelectedLink()
    else if link
      originalData =
        title: link.title
        color: link.color
        relation: link.relation
      @undoRedoManager.createAndExecuteCommand 'changeLink',
        execute: => @_changeLink link,  changes
        undo: => @_changeLink link, originalData

  _maybeChangeSelectedItem: (item) ->
    # TODO: This is kind of hacky:
    if @selectionManager.isSelected(item)
      @selectionManager._notifySelectionChange()

  _changeLink: (link, changes) ->
    log.info "Change  for #{link.title}"
    for key in ['title','color', 'relation']
      if changes[key]?
        log.info "Change #{key} for #{link.title}"
        link[key] = changes[key]
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

  deleteSelected: ->
    log.info "Deleting selected items"
    @removeSelectedLink()
    @removeSelectedNode()

  removeSelectedNode: ->
    nodeKey = @selectedNode()?.key
    if nodeKey
      @removeNode nodeKey
      @selectionManager.clearSelection()

  removeSelectedLink: ->
    selectedLink = @selectionManager.getLinkInspection()[0] or null
    if selectedLink
      @removeLink(selectedLink)
      @selectionManager.clearSelection()

  removeLinksForNode: (node) ->
    @removeLink(link) for link in node.links

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

  updateListeners: ->
    data =
      nodes: @getNodes()
      links: @getLinks()
    GraphActions.graphChanged.trigger(data)


mixin =
  getInitialState: ->
    nodes: GraphStore.nodes
    links: GraphStore.links

  componentDidMount: ->
    @unsubscribe = GraphActions.graphChanged.listen @onGraphChanged

  componentWillUnmount: ->
    @unsubscribe()

  onGraphChanged: (status) ->
    @setState
      nodes: status.nodes
      links: status.links
    # TODO: not this:
    @diagramToolkit?.repaint()


module.exports =
  # actions: GraphActions
  store: GraphStore
  mixin: mixin
