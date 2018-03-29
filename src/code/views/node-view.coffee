{input, div, i, img, span, label, img} = React.DOM
tr = require "../utils/translate"

SimulationActions = require("../stores/simulation-store").actions
SquareImage = React.createFactory require "./square-image-view"
StackedImage = React.createFactory require "./stacked-image-view"
SliderView  = React.createFactory require "./value-slider-view"
GraphView   = React.createFactory require "./node-svg-graph-view"
CodapConnect = require '../models/codap-connect'
DEFAULT_CONTEXT_NAME = 'building-models'

InspectorPanelStore = require "../stores/inspector-panel-store"

NodeTitle = React.createFactory React.createClass
  displayName: "NodeTitle"
  mixins: [require '../mixins/node-title']

  getInitialState: ->
    isUniqueTitle: @isUniqueTitle @props.node.title

  isUniqueTitle: (title) ->
    @props.graphStore.isUniqueTitle title, @props.node

  componentWillUnmount: ->
    if @props.isEditing
      @inputElm().off()

  componentWillUpdate: (nextProps) ->
    # mark the title as updated even if no change was made when it leaves edit mode
    @titleUpdated = true if @props.isEditing and not nextProps.isEditing

  componentDidUpdate: ->
    if @props.isEditing
      $elem = @inputElm()
      $elem.focus()

      $elem.off()
      enterKey = 13
      $elem.on "keyup", (e)=>
        if e.which is enterKey
          @finishEditing()

  inputElm: ->
    $(@refs.input)

  inputValue: ->
    @inputElm().val()

  detectDeleteWhenEmpty: (e) ->
    # 8 is backspace, 46 is delete
    if e.which in [8, 46] and not @titleUpdated
      @props.graphStore.removeNode @props.nodeKey

  updateTitle: (isComplete) ->
    @titleUpdated = true
    newTitle = @cleanupTitle(@inputValue(), isComplete)
    @setState isUniqueTitle: @isUniqueTitle newTitle
    @props.onChange(newTitle, isComplete)

  finishEditing: ->
    @updateTitle(true)
    @props.onStopEditing()

  renderTitle: ->
    (div {
      className: "node-title#{if @isDefaultTitle then ' untitled' else ''}"
      key: "display"
      style: { display: if @props.isEditing then "none" else "block" }
      onClick: @props.onStartEditing
    }, @props.title)

  renderTitleInput: ->
    displayTitle = @displayTitleForInput(@props.title)
    canDeleteWhenEmpty = @props.node.addedThisSession and not @titleUpdated
    className = "node-title#{if not @state.isUniqueTitle then ' non-unique-title' else ''}"
    (input {
      type: "text"
      ref: "input"
      key: "edit"
      style: { display: if @props.isEditing then "block" else "none" }
      className: className
      onKeyUp: if canDeleteWhenEmpty then @detectDeleteWhenEmpty else null
      onChange: => @updateTitle()
      value: displayTitle
      maxLength: @maxTitleLength()
      placeholder: @titlePlaceholder()
      onBlur: => @finishEditing()
    })

  render: ->
    (div {className: 'node-title-box'}, [
      @renderTitle()
      @renderTitleInput()
    ])

module.exports = NodeView = React.createClass

  displayName: "NodeView"

  componentDidUpdate: ->
    handle = '.img-background'
    if @props.selected
      handle = null
    $elem = $(@refs.node)
    $elem.draggable( "option", "handle", handle)

  componentDidMount: ->
    $elem = $(@refs.node)
    $elem.draggable
      drag: @doMove
      stop: @doStop
      containment: "parent"

  getInitialState: ->
    editingNodeTitle: false
    ignoreDrag: false
    isTransfer: @props.data.isTransfer

  handleSelected: (actually_select, evt) ->
    return if not @props.selectionManager

    selectionKey = if actually_select then @props.nodeKey else "dont-select-anything"
    multipleSelections = evt.ctrlKey || evt.metaKey || evt.shiftKey
    @props.selectionManager.selectNodeForInspection(@props.data, multipleSelections)

    # open the relationship panel on double click if the node has incombing links
    if @props.data.inLinks().length > 0
      now = (new Date()).getTime()
      if now - (@lastClickLinkTime || 0) <= 250
        InspectorPanelStore.actions.openInspectorPanel 'relations'
      @lastClickLinkTime = now

  propTypes:
    onDelete: React.PropTypes.func
    onMove: React.PropTypes.func
    onSelect: React.PropTypes.func
    nodeKey: React.PropTypes.string

  getDefaultProps: ->
    onMove:   -> log.info "internal move handler"
    onStop:   -> log.info "internal move handler"
    onDelete: -> log.info "internal on-delete handler"
    onSelect: -> log.info "internal select handler"
    selected: false
    simulating: false
    value: null
    dataColor: "#aaa"
    data:
      title: "foo"
      x: 10
      y: 10
      color: "dark-blue"

  doMove: (evt, extra) ->
    @props.onMove
      nodeKey: @props.nodeKey
      reactComponent: this
      domElement: @refs.node
      syntheticEvent: evt
      extra: extra

    # returning false will cancel the drag
    return !@state.ignoreDrag

  doStop: (evt, extra) ->
    @props.onMoveComplete
      nodeKey: @props.nodeKey
      reactComponent: this
      domElement: @refs.node
      syntheticEvent: evt
      extra: extra

  doDelete: (evt) ->
    @props.onDelete
      nodeKey: @props.nodeKey
      reactComponent: this
      domElement: @refs.node
      syntheticEvent: evt

  changeValue: (newValue) ->
    @props.graphStore.changeNodeWithKey(@props.nodeKey, {initialValue:newValue})

  changeTitle: (newTitle, isComplete) ->
    newTitle = @props.graphStore.ensureUniqueTitle @props.data, newTitle if isComplete
    @props.graphStore.startNodeEdit()
    log.info "Title is changing to #{newTitle}"
    @props.graphStore.changeNodeWithKey(@props.nodeKey, {title:newTitle})

  startEditing: ->
    @initialTitle = @props.graphStore.nodeKeys[@props.nodeKey].title
    @props.selectionManager.selectNodeForTitleEditing(@props.data)

  stopEditing: ->
    @props.graphStore.endNodeEdit()
    @props.selectionManager.clearTitleEditing()

  isEditing: ->
    @props.selectionManager.isSelectedForTitleEditing(@props.data)

  renderValue: ->
    value = @props.data.value or @props.data.initialValue
    value = Math.round(value)
    (div {className: "value"},
      (label {}, tr "~NODE.SIMULATION.VALUE")
      (input  {type: "text", className: "value", value: value})
    )

  handleSliderDragStart: ->
    @setState ignoreDrag: true


  handleSliderDragEnd: ->
    @setState ignoreDrag: false

  renderSliderView: ->
    showHandle = @props.data.canEditInitialValue()
    value = @props.data.currentValue ? @props.data.initialValue
    if showHandle
      value = @props.data.initialValue

    (SliderView
      orientation: "vertical"
      filled: true
      height: 44
      width: 15
      showHandle: showHandle
      showLabels: false
      onValueChange: @changeValue
      value: value
      displaySemiQuant: @props.data.valueDefinedSemiQuantitatively
      max: @props.data.max
      min: @props.data.min
      onSliderDragStart: @handleSliderDragStart
      onSliderDragEnd: @handleSliderDragEnd
      color: @props.dataColor
    )

  handleGraphClick: (attributeName) ->
    codapConnect = CodapConnect.instance DEFAULT_CONTEXT_NAME
    codapConnect.createGraph(attributeName)

  handleCODAPAttributeDrag: (evt, attributeName) ->
    evt.dataTransfer.effectAllowed = 'moveCopy'
    evt.dataTransfer.setData('text/html', attributeName)
    evt.dataTransfer.setData('text', attributeName)
    evt.dataTransfer.setData('application/x-codap-attr-' + attributeName, attributeName)
    # CODAP sometimes seems to expect an SC.Array object with a `contains` method, so this avoids a potential error
    evt.dataTransfer.contains = () -> false

  nodeClasses: ->
    classes = ['elm']
    if @props.selected
      classes.push "selected"
    classes.join " "

  topClasses: ->
    classes = ['top']
    classes.push "link-top"
    classes.join " "

  linkTargetClasses: ->
    classes = ['link-target']
    if @props.simulating
      classes.push "simulate"
    classes.join " "

  nodeSliderClasses: ->
    if @props.simulating and @props.data.canEditInitialValue()
      "slider"
    else ""

  renderNodeInternal: ->
    getNodeImage = (node) ->
      if node.isAccumulator
        (StackedImage {
          image: node.image
          imageProps: node.collectorImageProps()
        })
      else
        (SquareImage {
          image: if node.isTransfer then 'img/nodes/transfer.png' else node.image
        })

    nodeImage = getNodeImage(@props.data)

    if @props.showMinigraph
      (GraphView {
        min: @props.data.min
        max: @props.data.max
        data: @props.data.frames
        color: @props.dataColor
        image: nodeImage
      })
    else
      nodeImage

  render: ->
    style =
      top: @props.data.y
      left: @props.data.x
      "color": @props.data.color
    fullWidthBackgroundClass = if @props.data.isTransfer then "full-width" else ""

    (div { className: @nodeClasses(), ref: "node", style: style},
      (div {className: @linkTargetClasses(), "data-node-key": @props.nodeKey},
        (div {},
          (div {className: "actions"},
            (div {className: "connection-source action-circle icon-codap-link", "data-node-key": @props.nodeKey})
            if @props.showGraphButton
              (div {
                className: "graph-source action-circle icon-codap-graph",
                draggable: true
                onDragStart: ((evt) => @handleCODAPAttributeDrag evt, @props.data.codapID)
                onClick: (=> @handleGraphClick @props.data.title)
              })
          )
          (div {className: @topClasses(), "data-node-key": @props.nodeKey},
            (div {
              className: "img-background transfer-target "+fullWidthBackgroundClass
              onClick: ((evt) => @handleSelected true, evt)
              onTouchEnd: (=> @handleSelected true)
              },
              @renderNodeInternal()
            )
            if @props.data.isTransfer
              (div {className: "node-title"}) # empty title to set node width the same
            else
              (div {
                draggable: @props.showGraphButton
                onDragStart: ((evt) => @handleCODAPAttributeDrag evt, @props.data.codapID)
              },
                (NodeTitle {
                  isEditing: @props.editTitle
                  title: @props.data.title
                  onChange: @changeTitle
                  onStopEditing: @stopEditing
                  onStartEditing: @startEditing
                  node: @props.data
                  nodeKey: @props.nodeKey
                  graphStore: @props.graphStore
                })
              )
          )
        )
        (div {className: @nodeSliderClasses() ,"data-node-key": @props.nodeKey},
          if @props.simulating
            (div {},
              # if not @props.data.valueDefinedSemiQuantitatively
              #   @renderValue()     # not sure if we plan to render value
              @renderSliderView()
            )
        )
      )
    )

# synchronized with corresponding CSS values
NodeView.nodeImageOffset = ->
  linkTargetTopMargin = 6   # .link-target
  elementTopMargin = 6      # .elm .top
  { left: 0, top: linkTargetTopMargin + elementTopMargin }

myView = React.createFactory NodeView

groupView = React.createFactory React.createClass
  render: ->
    selectSimulated =
      selected: true
      simulating: true
      data:
        x: 50
        y: 100
        title: "selectSimulated"

    simulated = _.clone selectSimulated, true
    simulated.selected = false
    simulated.data.x = 300

    selected = _.clone selectSimulated, true
    selected.simulating = false
    selected.data.x = 500
    selected.data.title = "selected"

    unselected = _.clone selected, true
    unselected.selected = false
    unselected.data.x = 800
    unselected.data.title = "unselected"
    (div {className: "group"},
      (myView selectSimulated)
      (myView simulated)
      (myView selected)
      (myView unselected)
    )

# window.testComponent = (domID) -> ReactDOM.render groupView(), domID
