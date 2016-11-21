Node             = React.createFactory require './node-view'
NodeModel        = require '../models/node'
Importer         = require '../utils/importer'
DiagramToolkit   = require '../utils/js-plumb-diagram-toolkit'
dropImageHandler = require '../utils/drop-image-handler'
tr               = require '../utils/translate'
PaletteStore     = require '../stores/palette-store'
GraphStore       = require '../stores/graph-store'
ImageDialogStore = require '../stores/image-dialog-store'
RelationFactory  = require "../models/relation-factory"

SimulationStore  = require "../stores/simulation-store"
AppSettingsStore = require "../stores/app-settings-store"
CodapStore       = require "../stores/codap-store"
LinkColors       = require "../utils/link-colors"

{div} = React.DOM

module.exports = React.createClass

  displayName: 'LinkView'
  mixins: [ GraphStore.mixin, SimulationStore.mixin, AppSettingsStore.mixin, CodapStore.mixin ]

  getDefaultProps: ->
    linkTarget: '.link-top'
    connectionTarget: '.link-target'

  componentDidMount: ->
    $container = $(@refs.container)

    @diagramToolkit = new DiagramToolkit $container,
      Container:            $container[0]
      handleConnect:        @handleConnect
      handleClick:          @handleLinkClick
      handleDoubleClick:    @handleLinkEditClick
      handleLabelEdit:      @handleLabelEdit

    @props.selectionManager.addSelectionListener (manager) =>
      lastLinkSelection = @state.selectedLink
      selectedNode      = manager.getNodeInspection()[0] or null
      editingNode       = manager.getNodeTitleEditing()[0] or null
      selectedLink      = manager.getLinkInspection()[0] or null
      editingLink       = manager.getLinkTitleEditing()[0] or null

      @setState
        selectedNode: selectedNode
        editingNode:  editingNode
        selectedLink: selectedLink
        editingLink: editingLink

      if lastLinkSelection is not @state.selectedLink
        @_updateToolkit()

    $container.droppable
      accept: '.palette-image'
      hoverClass: "ui-state-highlight"
      drop: (e, ui) =>
        # this seems crazy but we can't get the real drop target from the event so we have to calculate it
        # we also can't just make the inspector panel eat the drops because the container handler is called first
        $panel = $ '.inspector-panel-content'
        panel =
          width: $panel.width()
          height: $panel.height()
          offset: $panel.offset()

        inPanel = ui.offset.left >= panel.offset.left and
                  ui.offset.top >= panel.offset.top and
                  ui.offset.left <= panel.offset.left + panel.width and
                  ui.offset.top <= panel.offset.top + panel.height

        if not inPanel
          @addNode e, ui

  addNode: (e, ui) ->
    data = ui.draggable.data()
    if data.droptype is 'new'
      paletteItem = @addNewPaletteNode(e,ui)

    else if data.droptype is 'paletteItem'
      paletteItem = PaletteStore.store.palette[data.index]
      PaletteStore.actions.selectPaletteIndex(data.index)
      @addPaletteNode(ui,paletteItem)

  addNewPaletteNode: (e,ui) ->
    ImageDialogStore.actions.open (savedPaletteItem) =>
      if savedPaletteItem
        @addPaletteNode(ui, savedPaletteItem)

  addPaletteNode: (ui, paletteItem) ->
    # Default new nodes are untitled
    title = tr "~NODE.UNTITLED"
    offset = $(@refs.linkView).offset()
    newNode = new NodeModel
      x: ui.offset.left - offset.left
      y: ui.offset.top - offset.top
      title: title
      paletteItem: paletteItem.uuid
      image: paletteItem.image

    @props.graphStore.addNode newNode
    @props.graphStore.editNode newNode.key

  getInitialState: ->
    # nodes: covered by GraphStore mixin
    # links: covered by GraphStore mixin
    selectedNode: null
    editingNode: null
    selectedLink: null
    editingLink: null
    canDrop: false

  componentWillUpdate: ->
    @diagramToolkit?.clear?()

  componentDidUpdate: ->
    @_updateToolkit()

  handleEvent: (handler) ->
    if @ignoringEvents
      false
    else
      handler()
      true

  onNodeMoved: (node_event) ->
    @handleEvent ->
      GraphStore.store.moveNode node_event.nodeKey, node_event.extra.position, node_event.extra.originalPosition

  onNodeMoveComplete: (node_event) ->
    @handleEvent ->
      {left, top} = node_event.extra.position
      GraphStore.store.moveNodeCompleted node_event.nodeKey, node_event.extra.position, node_event.extra.originalPosition

  onNodeDeleted: (node_event) ->
    @handleEvent ->
      GraphStore.store.removeNode node_event.nodeKey

  handleConnect: (info, evnt) ->
    @handleEvent ->
      GraphStore.store.newLinkFromEvent info, evnt

  handleLinkClick: (connection, evnt) ->
    @handleEvent ->
      GraphStore.store.clickLink connection.linkModel

  handleLinkEditClick: (connection, evnt) ->
    @handleEvent ->
      GraphStore.store.editLink connection.linkModel

  _updateNodeValue: (name, key, value) ->
    changed = 0
    for node in @state.nodes
      if node.key is name
        node[key] = value
        changed++
    if changed > 0
      @setState nodes: @state.nodes

  _updateToolkit: ->
    if @.diagramToolkit
      @ignoringEvents = true
      @diagramToolkit.suspendDrawing()
      @_redrawLinks()
      @_redrawTargets()
      @diagramToolkit.resumeDrawing()
      @ignoringEvents = false

  _redrawTargets: ->
    @diagramToolkit.makeSource $(@refs.linkView).find '.connection-source'
    target = $(@refs.linkView).find @props.linkTarget
    targetStyle = 'node-link-target'

    @diagramToolkit.makeTarget target, targetStyle


  _redrawLinks: ->
    for link in @state.links
      source = $(ReactDOM.findDOMNode this.refs[link.sourceNode.key]).find(@props.connectionTarget)
      target = $(ReactDOM.findDOMNode this.refs[link.targetNode.key]).find(@props.connectionTarget)
      isSelected = @props.selectionManager.isSelected(link)
      isEditing = link is @state.editingLink
      isDashed = !link.relation.isDefined && @state.simulationPanelExpanded
      relationDetails = RelationFactory.selectionsFromRelation(link.relation)
      if relationDetails.vector? and relationDetails.vector.isCustomRelationship and link.relation.customData?
        link.color = LinkColors.customRelationship
      else
        link.color = LinkColors.default
      magnitude = relationDetails.magnitude
      gradual = relationDetails.gradual
      useGradient = false
      useVariableThickness = true
      if source and target
        opts = {
          source: source,
          target: target,
          label: link.title,
          color: link.color,
          magnitude: magnitude,
          isDashed: isDashed,
          isSelected: isSelected,
          isEditing: isEditing,
          gradual: gradual,
          useGradient: useGradient,
          useVariableThickness: useVariableThickness,
          linkModel: link,
          showIndicators: @state.relationshipSymbols
        }
        @diagramToolkit.addLink opts

  onDragOver: (e) ->
    if not @state.canDrop
      @setState canDrop: true
    e.preventDefault()

  onDragLeave: (e) ->
    @setState canDrop: false
    e.preventDefault()

  onDrop: (e) ->
    @setState canDrop: false
    e.preventDefault()
    try #not sure any of the code inside this block is used?
      # figure out where to drop files
      offset = $(@refs.linkView).offset()
      dropPos =
        x: e.clientX - offset.left
        y: e.clientY - offset.top

      # get the files
      dropImageHandler e, (file) =>
        #@props.graphStore.setImageMetadata file.image, file.metadata   #there is no setImageMetadata?
        node = @props.graphStore.importNode
          data:
            x: dropPos.x
            y: dropPos.y
            title: tr "~NODE.UNTITLED"
            image: file.image
        @props.graphStore.editNode(node.key)
    catch ex
      # user could have selected elements on the page and dragged those instead
      # of valid application items like connections or images
      console.log("Invalid drag/drop operation", ex)

  onContainerClicked: (e) ->
    if e.target is @refs.container
      # deselect links when background is clicked
      @props.selectionManager.clearSelection()

  handleLabelEdit: (title) ->
    @props.graphStore.changeLink @state.editingLink, {title: title}
    @props.selectionManager.clearSelection()

  render: ->
    (div {className: "graph-view #{if @state.canDrop then 'can-drop' else ''}", ref: 'linkView', onDragOver: @onDragOver, onDrop: @onDrop, onDragLeave: @onDragLeave},
      (div {className: 'container', ref: 'container', onClick: @onContainerClicked},
        for node in @state.nodes
          (Node {
            key: node.key
            data: node
            selected: @state.selectedNode is node
            simulating: @state.simulationPanelExpanded
            running: @state.modelIsRunning
            editTitle: @state.editingNode is node
            nodeKey: node.key
            ref: node.key
            onMove: @onNodeMoved
            onMoveComplete: @onNodeMoveComplete
            onDelete: @onNodeDeleted
            graphStore: @props.graphStore
            selectionManager: @props.selectionManager
            showMinigraph: @state.showingMinigraphs
            showGraphButton: @state.codapHasLoaded and not @state.diagramOnly
          })
      )
    )
