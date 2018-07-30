NodeView         = require './node-view'
Node             = React.createFactory NodeView
NodeModel        = require '../models/node'
Importer         = require '../utils/importer'
Color            = require '../utils/colors'
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
    transferTarget: '.link-target'

  componentDidMount: ->
    $container = $(@refs.container)

    @diagramToolkit = new DiagramToolkit $container,
      Container:            $container[0]
      handleConnect:        @handleConnect
      handleClick:          @handleLinkClick
      handleLabelEdit:      @handleLabelEdit

    # force an initial draw of the connections
    @_updateToolkit()

    @props.selectionManager.addSelectionListener (manager) =>
      [..., lastLinkSelection] = @state.selectedLink
      selectedNodes     = manager.getNodeInspection() or []
      editingNode       = manager.getNodeTitleEditing()[0] or null
      selectedLink      = manager.getLinkInspection() or []
      # only allow link labels if simulation is not in lockdown mode
      editingLink       = if not AppSettingsStore.store.settings.lockdown then manager.getLinkTitleEditing()[0] or null else false

      @setState
        selectedNodes: selectedNodes
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
    linkOffset = $(@refs.linkView).offset()
    imageOffset = NodeView.nodeImageOffset()
    newNode = new NodeModel
      x: ui.offset.left - linkOffset.left - imageOffset.left
      y: ui.offset.top - linkOffset.top - imageOffset.top
      title: title
      paletteItem: paletteItem.uuid
      image: paletteItem.image
      addedThisSession: true

    @props.graphStore.addNode newNode
    @props.graphStore.editNode newNode.key

  getInitialState: ->
    # nodes: covered by GraphStore mixin
    # links: covered by GraphStore mixin
    selectedNodes: []
    editingNode: null
    selectedLink: []
    editingLink: null
    canDrop: false
    drawingMarquee: false
    selectBox:
      startX: 0
      startY: 0
      x: 0
      y: 0

  componentDidUpdate: (prevProps, prevState) ->
    if (prevState.description.links != @state.description.links) or
        (prevState.simulationPanelExpanded != @state.simulationPanelExpanded) or
        (prevState.selectedLink != @state.selectedLink) or
        (prevState.relationshipSymbols != @state.relationshipSymbols) or
        @forceRedrawLinks
      @diagramToolkit?.clear?()
      @_updateToolkit()
      @forceRedrawLinks = false

  handleEvent: (handler) ->
    if @ignoringEvents
      false
    else
      handler()
      true

  onNodeMoved: (node_event) ->
    {left, top} = node_event.extra.position
    theNode = GraphStore.store.nodeKeys[node_event.nodeKey]
    leftDiff = left - theNode.x
    topDiff = top - theNode.y
    selectedNodes = @state.selectedNodes
    if (selectedNodes.length > 0)
      @handleEvent ->
        if theNode in selectedNodes
          for node in selectedNodes
            GraphStore.store.moveNode node.key, leftDiff, topDiff
        else # when node is unselected, but we drag it, only it should be dragged
          (GraphStore.store.moveNode theNode.key, leftDiff, topDiff)
    else
      # alert "leftDiff 2" + leftDiff
      @handleEvent ->
        GraphStore.store.moveNode node_event.nodeKey, leftDiff, topDiff

  onNodeMoveComplete: (node_event) ->
    {left, top} = node_event.extra.position
    leftDiff = left - node_event.extra.originalPosition.left
    topDiff = top - node_event.extra.originalPosition.top
    selectedNodes = @state.selectedNodes
    if (selectedNodes.length > 0)
      @handleEvent ->
        for node in selectedNodes
          GraphStore.store.moveNodeCompleted node.key, leftDiff, topDiff
    else
      @handleEvent ->
        GraphStore.store.moveNodeCompleted node_event.nodeKey, leftDiff, topDiff

  onNodeDeleted: (node_event) ->
    @handleEvent ->
      GraphStore.store.removeNode node_event.nodeKey

  handleConnect: (info, evnt) ->
    @handleEvent =>
      @forceRedrawLinks = true
      GraphStore.store.newLinkFromEvent info, evnt

  handleLinkClick: (connection, evt) ->
    @handleEvent =>
      multipleSelections = evt.ctrlKey || evt.metaKey || evt.shiftKey
      @forceRedrawLinks = true
      GraphStore.store.clickLink connection.linkModel, multipleSelections

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
      @_checkForLinkButtonClientClass()

  # There is a bug which only manifests in Firefox (but which may well be a jsPlumb bug)
  # in which the draggable rectangle that corresponds to the link source action circle
  # is offset from the link source action circle by half the size of the rectangle, i.e.
  # its top is aligned with the center of the action circle rather than its top. If we
  # hard-code the correction factor and browser-sniff for Firefox, then the fix becomes
  # a bug if the underlying bug is fixed by some future version of jsPlumb. Therefore,
  # we dynamically check for the existence of the bug and apply the `.correct-drag-top`
  # class only in situations where we've determined the fix applies. We can't easily
  # apply an arbitrary correction factor because the node in question is absolutely
  # positioned by jsPlumb. We can apply a class with a constant correction factor that
  # we know corresponds to the observed Firefox behavior and only apply it if the
  # detected offset is great enough to make the constant correction an improvement.
  # https://www.pivotaltracker.com/story/show/142418227
  _checkForLinkButtonClientClass: ->
    return if @linkButtonClientClass?
    nodeLinkButtonElts = $('.graph-view').find('.node-link-button')
    nodeLinkButtonElt = nodeLinkButtonElts and nodeLinkButtonElts[0]
    connectionSrcElt = nodeLinkButtonElt and nodeLinkButtonElt._jsPlumbRelatedElement
    if connectionSrcElt and nodeLinkButtonElt
      connectionSrcTop = connectionSrcElt.getBoundingClientRect().top
      nodeLinkButtonTop = nodeLinkButtonElt.getBoundingClientRect().top
      topOffset = nodeLinkButtonTop - connectionSrcTop
      @linkButtonClientClass = if topOffset > 6 then 'correct-drag-top' else ''

  _redrawTargets: ->
    @diagramToolkit.makeSource ($(@refs.linkView).find '.connection-source'), @linkButtonClientClass
    target = $(@refs.linkView).find @props.linkTarget
    targetStyle = 'node-link-target'

    @diagramToolkit.makeTarget target, targetStyle

  _redrawLinks: ->
    for link in @state.links
      if link.relation?.isTransfer
        @_redrawTransferLinks link
      else
        @_redrawLink link

  _redrawLink: (link) ->
    source = $(ReactDOM.findDOMNode this.refs[link.sourceNode.key]).find(@props.connectionTarget)
    target = $(ReactDOM.findDOMNode this.refs[link.targetNode.key]).find(@props.connectionTarget)
    isSelected = @props.selectionManager.isSelected(link)
    isEditing = link is @state.editingLink
    isDashed = !link.relation.isDefined && @state.simulationPanelExpanded
    relationDetails = RelationFactory.selectionsFromRelation(link.relation)
    if relationDetails.vector?.isCustomRelationship and link.relation.customData?
      link.color = LinkColors.customRelationship
    else if relationDetails.accumulator?.id is "setInitialValue"
      link.color = LinkColors.customRelationship
    else if link.relation.isTransferModifier
      link.color = LinkColors.fromLink link
    else
      link.color = LinkColors.fromLink link
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
      if relationDetails.transferModifier?
        opts.thickness = RelationFactory.thicknessFromRelation(link.relation)
      @diagramToolkit.addLink opts

  _redrawTransferLinks: (link) ->
    # during import of saved files .transferNode isn't set until the link is created so it may be null here
    return unless link.transferNode
    @_redrawTransferLink link, link.sourceNode, link.transferNode
    @_redrawTransferLink link, link.transferNode, link.targetNode

  _redrawTransferLink: (link, sourceNode, targetNode) ->
    fromSource = sourceNode is link.sourceNode
    sourceConnectionClass = if fromSource then @props.connectionTarget else @props.transferTarget
    targetConnectionClass = if not fromSource then @props.connectionTarget else @props.transferTarget
    source = $(ReactDOM.findDOMNode this.refs[sourceNode.key]).find(sourceConnectionClass)
    target = $(ReactDOM.findDOMNode this.refs[targetNode.key]).find(targetConnectionClass)
    if source and target
      opts = {
        fromSource: fromSource
        source: source
        target: target
        label: ""
        color: LinkColors.transferPipe
        thickness: 10
        showIndicators: false
        isEditing: false
        linkModel: link
        isTransfer: true
        hideArrow: fromSource
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

  onMouseDown: (e) ->
    if e.target is @refs.container
      # deselect links when background is clicked
      @forceRedrawLinks = true
      @props.selectionManager.clearSelection()
      selectBox = $.extend({}, @state.selectBox)
      offset = $(@refs.linkView).offset()
      selectBox.startX = e.pageX - offset.left
      selectBox.startY = e.pageY - offset.top
      selectBox.x = selectBox.startX
      selectBox.y = selectBox.startY
      @setState drawingMarquee: true, selectBox: selectBox

  onMouseUp: (e) ->
    if e.target is @refs.container
    # deselect links when background is clicked
      @props.selectionManager.clearSelection()
      if @state.drawingMarquee
     # end of drawing Marquee, check what is selected
        @checkSelectBoxCollisions()
        @setState drawingMarquee: false
    if @state.drawingMarquee
    # end of drawing Marquee, check what is selected
      @checkSelectBoxCollisions()
      @checkSelectBoxLinkCollisions()
      @setState drawingMarquee: false

  onMouseMove: (e) ->
    if @state.drawingMarquee
      offset = $(@refs.linkView).offset()
      selectBox = $.extend({}, @state.selectBox)
      selectBox.x = e.pageX - offset.left
      selectBox.y = e.pageY - offset.top
      @setState selectBox: selectBox

  checkSelectBoxLinkCollisions: ->
    for link in @state.links
      if not link.relation?.isTransfer and this.checkBoxLinkCollision(link)
        @props.selectionManager.selectLinkForInspection(link, true)

  checkSelectBoxCollisions: ->
    for node in @state.nodes
      if this.checkSelectBoxCollision(node)
        @props.selectionManager.selectNodeForInspection(node, true)

  # Detecting collision between drawn selectBox and existing link
  # Start of the link is (x0,y0), upper left corner of the most left node
  # End of the link is (x1,y1), lower right corner of the most right node
  # Function uses Liang-Barsky algorithm described at https://gist.github.com/ChickenProp/3194723
  checkBoxLinkCollision: (link) ->
    selectBox = @state.selectBox
    connection = link.jsPlumbConnection

    # Marquee selectBox
    sX = Math.min(selectBox.startX, selectBox.x)
    sY = Math.min(selectBox.startY, selectBox.y)
    x = Math.max(selectBox.startX, selectBox.x)
    y = Math.max(selectBox.startY, selectBox.y)

    # Link endpoints
    origin = connection.endpoints[0].endpoint
    destination = connection.endpoints[1].endpoint

    x0 = origin.x
    y0 = origin.y
    x1 = destination.x
    y1 = destination.y

    p = [x0-x1, x1-x0,  y0-y1, y1-y0]
    q = [x0-sX, x-x0, y0 - sY, y-y0]
    u1 = Number.MIN_VALUE
    u2 = Number.MAX_VALUE

    for i in [0..3]
      if (p[i] == 0) and (q[i] < 0)
        return false
      else
        t = q[i] / p[i]
        if (p[i] < 0 and u1 < t)
          u1 = t
        else if (p[i] > 0 && u2 > t)
          u2 = t

    if (u1 > u2 or u1 > 1 or u1 < 0)
      return false
    true

  checkSelectBoxCollision: (node) ->
    nodeWidth = 45 # Width of node in px
    nodeHeight = 45 # Height of node in px
    selectBox = @state.selectBox
    sX = Math.min(selectBox.startX, selectBox.x)
    sY = Math.min(selectBox.startY, selectBox.y)
    x = Math.max(selectBox.startX, selectBox.x)
    y = Math.max(selectBox.startY, selectBox.y)

    a = (node.x < x)
    b = (node.x + nodeWidth > sX)
    c = (node.y < y)
    d = (nodeHeight + node.y > sY)
    result = (a and b and c and d)
    result

  handleLabelEdit: (link, title) ->
    @props.graphStore.changeLink link, {title: title}
    @props.selectionManager.clearSelection()

  render: ->
    dataColor = Color.colors.mediumGray.value
    innerColor = Color.colors.mediumGrayInner.value
    if @state.isRecording
      dataColor = Color.colors.data.value
      innerColor = Color.colors.dataInner.value
    diagramOnly = @state.simulationType is AppSettingsStore.store.SimulationType.diagramOnly

    (div {className: "graph-view #{if @state.canDrop then 'can-drop' else ''}", ref: 'linkView', onDragOver: @onDragOver, onDrop: @onDrop, onDragLeave: @onDragLeave},
      (div {className: 'container', ref: 'container', onMouseDown: @onMouseDown, onMouseUp: @onMouseUp, onMouseMove: @onMouseMove},
        if @state.drawingMarquee
          left = Math.min(@state.selectBox.startX, @state.selectBox.x)
          top = Math.min(@state.selectBox.startY, @state.selectBox.y)
          (div {className: 'selectionBox', ref: 'selectionBox', style: {width: Math.abs(@state.selectBox.x-@state.selectBox.startX), height: Math.abs(@state.selectBox.y-@state.selectBox.startY), left: left, top: top, border: '1px dotted #CCC', position: 'absolute', backgroundColor: '#FFFFFF'}})
        for node in @state.nodes
          (Node {
            key: node.key
            data: node
            dataColor: dataColor
            innerColor: innerColor
            selected: node in @state.selectedNodes
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
            isTimeBased: @state.isTimeBased
            showGraphButton: @state.codapHasLoaded and not diagramOnly
          })
      )
    )
