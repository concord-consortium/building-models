{div, i, img} = React.DOM

module.exports = React.createClass

  displayName: 'NodeView'

  componentDidMount: ->
    $elem = $(@refs.node.getDOMNode())
    $elem.draggable
      # grid: [ 10, 10 ]
      drag: @doMove
      stop: @doStop
      containment: 'parent'
    $elem.bind 'click touchend', (=> @handleSelected true)

  handleSelected: (actually_select) ->
    if @props.linkManager
      selectionKey = if actually_select then @props.nodeKey else 'dont-select-anything'
      @props.linkManager.selectNode selectionKey

  propTypes:
    onDelete: React.PropTypes.func
    onMove: React.PropTypes.func
    onSelect: React.PropTypes.func
    nodeKey: React.PropTypes.string

  getDefaultProps: ->
    onMove:   -> log.info 'internal move handler'
    onStop:   -> log.info 'internal move handler'
    onDelete: -> log.info 'internal on-delete handler'
    onSelect: -> log.info 'internal select handler'

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

  render: ->
    style =
      top: @props.data.y
      left: @props.data.x
      'color': @props.data.color
    className = "elm"
    if @props.selected
      className = "#{className} selected"
    (div { className: className, ref: 'node', style: style, 'data-node-key': @props.nodeKey},
      (div {className: "img-background"},
        (if @props.data.image?.length > 0 and @props.data.image isnt '#remote' then (img {src: @props.data.image}) else null)
      )
      (div {className: 'node-title'}, @props.data.title)
    )

