{input, div, i, img} = React.DOM
tr = require "../utils/translate"

NodeTitle = React.createFactory React.createClass
  displayName: "NodeTitle"
  mixins: [require '../mixins/node-title']
  getDefaultProps: ->


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
    $(@refs.input.getDOMNode())

  inputValue: ->
    @inputElm().val()

  updateTitle: (e) ->
    newTitle = @cleanupTitle(@inputValue())
    @props.onChange(newTitle)

  finishEditing: ->
    @updateTitle()
    @props.onStopEditing()

  renderTitle: ->
    (div {className: "node-title", onClick: @props.onStartEditing }, @props.title)

  renderTitleInput: ->
    displayTitle = @displayTitleForInput(@props.title)
    (input {
      type: "text"
      ref: "input"
      className: "node-title"
      onChange: @updateTitle
      value: displayTitle
      maxlength: @maxTitleLength
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

module.exports = React.createClass

  displayName: "NodeView"

  componentDidMount: ->
    $elem = $(@refs.node.getDOMNode())
    $elem.draggable
      # grid: [ 10, 10 ]
      drag: @doMove
      stop: @doStop
      containment: "parent"

  getInitialState: ->
    editingNodeTitle: false

  handleSelected: (actually_select) ->
    if @props.selectionManager
      selectionKey = if actually_select then @props.nodeKey else "dont-select-anything"
      @props.selectionManager.selectForInspection(@props.data)

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

  doMove: (evt, extra) ->
    @props.onMove
      nodeKey: @props.nodeKey
      reactComponent: this
      domElement: @refs.node.getDOMNode()
      syntheticEvent: evt
      extra: extra

  doStop: (evt, extra) ->
    @props.onMoveComplete
      nodeKey: @props.nodeKey
      reactComponent: this
      domElement: @refs.node.getDOMNode()
      syntheticEvent: evt
      extra: extra

  doDelete: (evt) ->
    @props.onDelete
      nodeKey: @props.nodeKey
      reactComponent: this
      domElement: @refs.node.getDOMNode()
      syntheticEvent: evt

  changeTitle: (newTitle) ->
    @props.graphStore.startNodeEdit()
    log.info "Title is changing to #{newTitle}"
    @props.graphStore.changeNodeWithKey(@props.nodeKey, {title:newTitle})

  startEditing: ->
    @props.selectionManager.selectForTitleEditing(@props.data)

  stopEditing: ->
    @props.graphStore.endNodeEdit()
    @props.selectionManager.clearTitleEditing()

  isEditing: ->
    @props.selectionManager.isSelectedForTitleEditing(@props.data)

  render: ->
    style =
      top: @props.data.y
      left: @props.data.x
      "color": @props.data.color
    className = "elm"
    if @props.selected
      className = "#{className} selected"
    (div { className: className, ref: "node", style: style, "data-node-key": @props.nodeKey},
      (div {
        className: "img-background"
        onClick: (=> @handleSelected true)
        onTouchend: (=> @handleSelected true)
        },
        (if @props.data.image?.length > 0 and @props.data.image isnt "#remote" then (img {src: @props.data.image}) else null)
        if @props.selected
          (div {className: "connection-source", "data-node-key": @props.nodeKey})
      )
      (NodeTitle {
        isEditing: @props.editTitle
        title: @props.data.title
        onChange: @changeTitle
        onStopEditing: @stopEditing
        onStartEditing: @startEditing
      })
    )
