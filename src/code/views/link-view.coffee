Node             = React.createFactory require './node-view'
Importer         = require '../utils/importer'
NodeList         = require '../models/link-manager'
DiagramToolkit   = require '../utils/js-plumb-diagram-toolkit'
dropImageHandler = require '../utils/drop-image-handler'
tr               = require '../utils/translate'
PaletteStore   = require '../stores/palette-store'
ImageDialogStore     = require '../stores/image-dialog-store'

{div} = React.DOM

module.exports = React.createClass

  displayName: 'LinkView'

  componentDidMount: ->
    $container = $(@refs.container.getDOMNode())

    @diagramToolkit = new DiagramToolkit $container,
      Container:     $container[0]
      handleConnect: @handleConnect
      handleClick:   @handleClick

    @props.linkManager.addLinkListener @
    @props.linkManager.addNodeListener @

    @props.selectionManager.addSelectionListener (manager) =>
      lastLinkSelection = @state.selectedLink
      selectedNode      = manager.getInspection()[0] or null
      editingNode       = manager.getTitleEditing()[0] or null
      selectedLink      = manager.getLinkSelection()[0] or null

      @setState
        selectedNode: selectedNode
        editingNode:  editingNode
        selectedLink: selectedLink

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
      @addPaletteNode(ui,paletteItem)

  addNewPaletteNode: (e,ui) ->
    ImageDialogStore.actions.open (savedPaletteItem) =>
      if savedPaletteItem
        @addPaletteNode(ui, savedPaletteItem)


  addPaletteNode: (ui, paletteItem) ->
    # Default new nodes are untitled
    title = tr "~NODE.UNTITLED"
    offset = $(@refs.linkView.getDOMNode()).offset()
    node = @props.linkManager.importNode
      data:
        x: ui.offset.left - offset.left
        y: ui.offset.top - offset.top
        title: title
        image: paletteItem.image
    @props.linkManager.editNode(node.key)



  getInitialState: ->
    nodes: []
    links: []
    selectedNode: null
    editingNode: null
    selectedLink: null
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
    @handleEvent =>
      @props.linkManager.moveNode node_event.nodeKey, node_event.extra.position, node_event.extra.originalPosition

  onNodeMoveComplete: (node_event) ->
    @handleEvent =>
      {left, top} = node_event.extra.position
      @props.linkManager.moveNodeCompleted node_event.nodeKey, node_event.extra.position, node_event.extra.originalPosition

  onNodeDeleted: (node_event) ->
    @handleEvent =>
      @props.linkManager.removeNode node_event.nodeKey

  handleConnect: (info, evnt) ->
    @handleEvent =>
      @props.linkManager.newLinkFromEvent info, evnt

  handleClick: (connection, evnt) ->
    @handleEvent =>
      @props.linkManager.selectLink connection.linkModel

  handleLinkAdd: (info, evnt) ->
    @setState links: @props.linkManager.getLinks()
    true

  handleLinkRm: ->
    @setState links: @props.linkManager.getLinks()
    false

  handleNodeChange: (nodeData) ->
    @setState nodes: @props.linkManager.getNodes()
    true

  handleNodeAdd: (nodeData) ->
    @setState nodes: @props.linkManager.getNodes()
    true

  handleNodeMove: (nodeData) ->
    # TODO: PERF: we could look up the dom elem
    # for that node, and then just tell the
    # toolkit to repaint the links for that one elem...
    @setState nodes: @props.linkManager.getNodes()
    @diagramToolkit.repaint()
    true

  handleNodeRm: ->
    @setState nodes: @props.linkManager.getNodes()
    false

  # TODO, can we get rid of this?
  _nodeForName: (name) ->
    @refs[name]?.getDOMNode() or false

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
      @diagramToolkit.supspendDrawing()
      @_redrawLinks()
      @_redrawTargets()
      @diagramToolkit.resumeDrawing()
      @ignoringEvents = false

  _redrawTargets: ->
    @diagramToolkit.makeSource $(@refs.linkView.getDOMNode()).find('.connection-source')
    @diagramToolkit.makeTarget $(@refs.linkView.getDOMNode()).find '.elm'

  _redrawLinks: ->
    for link in @state.links
      source = @_nodeForName link.sourceNode.key
      target = @_nodeForName link.targetNode.key
      isSelected = @props.selectionManager.isSelected(link)
      if source and target
        @diagramToolkit.addLink source, target, link.title, link.color, isSelected, link

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

    # figure out where to drop files
    offset = $(@refs.linkView.getDOMNode()).offset()
    dropPos =
      x: e.clientX - offset.left
      y: e.clientY - offset.top

    # get the files
    dropImageHandler e, (file) =>
      @props.linkManager.setImageMetadata file.image, file.metadata
      node = @props.linkManager.importNode
        data:
          x: dropPos.x
          y: dropPos.y
          title: tr "~NODE.UNTITLED"
          image: file.image
      @props.linkManager.editNode(node.key)

  onContainerClicked: (e) ->
    if e.target is @refs.container.getDOMNode()
      # deselect links when background is clicked
      @props.selectionManager.clearSelection()

  render: ->
    (div {className: "link-view #{if @state.canDrop then 'can-drop' else ''}", ref: 'linkView', onDragOver: @onDragOver, onDrop: @onDrop, onDragLeave: @onDragLeave},
      (div {className: 'container', ref: 'container', onClick: @onContainerClicked},
        for node in @state.nodes
          (Node {
            key: node.key
            data: node
            selected: @state.selectedNode is node
            editTitle: @state.editingNode is node
            nodeKey: node.key
            ref: node.key
            onMove: @onNodeMoved
            onMoveComplete: @onNodeMoveComplete
            onDelete: @onNodeDeleted
            linkManager: @props.linkManager
            selectionManager: @props.selectionManager
          })
      )
    )
