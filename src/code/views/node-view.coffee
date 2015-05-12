{input, div, i, img} = React.DOM
tr = require "../utils/translate"

NodeTitle = React.createFactory React.createClass
  displayName: "NodeTitle"

  getDefaultProps: ->
    isEditing: false
    defaultValue: tr "~NODE.UNTITLED"

  getInitialState: ->
    isEditing: @props.editing
    title: @props.title

  componentWillUnmount: ->
    # remove jQuery listeners
    $(@getDOMNode()).off()

  componentDidUpdate: ->
    $elem = $(@getDOMNode())
    if @state.isEditing
      $elem.focus()

    # switching btween div and input dom elements
    # componentDidMount wasn"t adequate for
    # registering this listener
    $elem.off()
    if @state.isEditing
      enterKey = 13
      $elem.on "keyup", (e)=>
        if e.which is enterKey
          @finishEditing()

  toggleEdit:(e) ->
    @setState({isEditing: not @state.isEditing})

  updateTitle: (e) ->
    newTitle = $(@getDOMNode()).val()
    newTitle = if newTitle.length > 0 then newTitle else @props.defaultValue
    @props.onChange(newTitle)

  finishEditing: ->
    @updateTitle()
    @setState({isEditing: false})

  renderTitle: ->
    (div {className: "node-title", onClick: @toggleEdit }, @props.title)

  renderTitleInput: ->
    (input {
      type: "text"
      className: "node-title"
      onChange: @updateTitle
      value: @props.title
      placeholder: @props.defaultValue
      onBlur: =>
        @finishEditing()
    }, @props.title)

  render: ->
    if @state.isEditing
      @renderTitleInput()
    else
      @renderTitle()

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
    if @props.linkManager
      selectionKey = if actually_select then @props.nodeKey else "dont-select-anything"
      @props.linkManager.selectNode selectionKey

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
    log.info "Title is changing to #{newTitle}"
    @props.linkManager.changeNodeWithKey(@props.nodeKey, {title:newTitle})

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
        edit: @state.editingNodeTitle
        title: @props.data.title
        onChange: @changeTitle
      })
    )

