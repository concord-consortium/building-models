Node           = React.createFactory require './node-view'
Importer       = require '../utils/importer'
NodeList       = require '../models/link-manager'
DiagramToolkit = require '../utils/js-plumb-diagram-toolkit'

{div} = React.DOM

module.exports = React.createClass

  displayName: 'LinkView'
  
  componentDidMount: ->
    $container = $(@refs.container.getDOMNode())
    
    @diagramToolkit = new DiagramToolkit $container,
      Container: $container[0],
      handleConnect: @handleConnect
      handleClick: @handleClick
    @_updateToolkit()
    
    @props.linkManager.addLinkListener @
    @props.linkManager.addNodeListener @
    
    $container.droppable
      accept: '.proto-node'
      hoverClass: "ui-state-highlight"
      drop: @addNode

  addNode: (e, ui) ->
    {title, image} = ui.draggable.data()
    offset = $(@refs.linkView.getDOMNode()).offset()
    @props.linkManager.importNode
      data:
        x: ui.offset.left - offset.left
        y: ui.offset.top - offset.top
        title: title
        image: image

  getInitialState: ->
    nodes: []
    links: []

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
      {left, top} = node_event.extra.position
      @props.linkManager.moveNode node_event.nodeKey, left, top

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
    @diagramToolkit.makeTarget $(@refs.linkView.getDOMNode()).find '.elm'

  _redrawLinks: ->
    for link in @state.links
      source = @_nodeForName link.sourceNode.key
      target = @_nodeForName link.targetNode.key
      if source and target
        sourceTerminal = if link.sourceTerminal is 'a' then 'Top' else 'Bottom'
        targetTerminal = if link.targetTerminal is 'a' then 'Top' else 'Bottom'
        @diagramToolkit.addLink source, target, link.title, link.color, sourceTerminal, targetTerminal, link

  render: ->
    (div {className: 'link-view', ref: 'linkView'},
      (div {className: 'container', ref: 'container'},
        for node in @state.nodes
          (Node {
            key: node.key
            data: node
            selected: node.selected
            nodeKey: node.key
            ref: node.key
            onMove: @onNodeMoved
            onDelete: @onNodeDeleted
            linkManager: @props.linkManager
          })
      )
    )


