{input, div, i, img, span, label} = React.DOM
tr = require "../utils/translate"

SquareImage = React.createFactory require "./square-image-view"
SliderView  = React.createFactory require "./value-slider-view"
GraphView   = React.createFactory require "./node-svg-graph-view"
CodapConnect = require '../models/codap-connect'
DEFAULT_CONTEXT_NAME = 'building-models'

NodeTitle = React.createFactory React.createClass
  displayName: "NodeTitle"
  mixins: [require '../mixins/node-title']

  componentWillUnmount: ->
    if @props.isEditing
      @inputElm().off()

  componentDidUpdate: ->
    if @props.isEditing
      $elem =@inputElm()
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

  updateTitle: (e) ->
    newTitle = @cleanupTitle(@inputValue())
    @props.onChange(newTitle)

  finishEditing: ->
    @updateTitle()
    @props.onStopEditing()

  renderTitle: ->
    className = "node-title"
    if @isDefaultTitle()
      className = "node-title untitled"
    (div {className: className, onClick: @props.onStartEditing }, @props.title)

  renderTitleInput: ->
    displayTitle = @displayTitleForInput(@props.title)
    (input {
      type: "text"
      ref: "input"
      className: "node-title"
      onChange: @updateTitle
      value: displayTitle
      maxLength: @maxTitleLength
      placeholder: @titlePlaceholder()
      onBlur: =>
        @finishEditing()
    })

  render: ->
    (div {className: 'node-title-box'},
      if @props.isEditing
        @renderTitleInput()
      else
        @renderTitle()
    )

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

  handleSelected: (actually_select) ->
    if @props.selectionManager
      selectionKey = if actually_select then @props.nodeKey else "dont-select-anything"
      @props.selectionManager.selectNodeForInspection(@props.data)

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

  changeTitle: (newTitle) ->
    @props.graphStore.startNodeEdit()
    log.info "Title is changing to #{newTitle}"
    @props.graphStore.changeNodeWithKey(@props.nodeKey, {title:newTitle})

  startEditing: ->
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

  renderSliderView: ->
    enabled = not @props.running or @props.data.canEditValueWhileRunning()
    (SliderView
      horizontal: false
      filled: true
      height: 44
      width: 15
      showHandle: @props.data.canEditInitialValue()
      showLabels: false
      onValueChange: @changeValue
      value: @props.data.initialValue
      displaySemiQuant: @props.data.valueDefinedSemiQuantitatively
      max: @props.data.max
      min: @props.data.min
      enabled: enabled
    )

  handleGraphClick: (attributeName) ->
    codapConnect = CodapConnect.instance DEFAULT_CONTEXT_NAME
    codapConnect.createGraph(attributeName)

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
    if @props.showMinigraph
      (GraphView {
        min: @props.data.min
        max: @props.data.max
        data: @props.data.frames
      })
    else
      (SquareImage {
        image: @props.data.image,
        ref: "thumbnail"
      })


  render: ->
    style =
      top: @props.data.y
      left: @props.data.x
      "color": @props.data.color

    (div { className: @nodeClasses(), ref: "node", style: style},
      (div {className: @linkTargetClasses(), "data-node-key": @props.nodeKey},
        (div {},
          (div {className: "actions"},
            (div {className: "connection-source action-circle icon-codap-link", "data-node-key": @props.nodeKey})
            if @props.showGraphButton
              (div {
                className: "graph-source action-circle icon-codap-graph",
                onClick: (=> @handleGraphClick @props.data.title)
              })
          )

          (div {className: @topClasses(), "data-node-key": @props.nodeKey},
            (div {
              className: "img-background"
              onClick: (=> @handleSelected true)
              onTouchend: (=> @handleSelected true)
              },
              @renderNodeInternal()
            )
            (NodeTitle {
              isEditing: @props.editTitle
              title: @props.data.title
              onChange: @changeTitle
              onStopEditing: @stopEditing
              onStartEditing: @startEditing
            })
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
