{div, img} = React.DOM

module.exports = React.createClass

  displayName: 'ProtoNode'

  componentDidMount: ->
    $(@refs.node.getDOMNode()).draggable
      drag: @doMove
      revert: true
      helper: 'clone'
      revertDuration: 0
      opacity: 0.35

  doMove: -> undefined

  onClick: ->
    @props.onNodeClicked? @props.image

  render: ->
    (div {className: 'proto-node', ref: 'node', onClick: @onClick, 'data-node-key': @props.key, 'data-image': @props.image, 'data-title': @props.title},
      (div {className: 'img-background'}, if @props.image?.length > 0 then (img {src: @props.image}) else null)
    )
