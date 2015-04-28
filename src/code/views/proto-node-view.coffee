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
      appendTo: 'body'
      zIndex: 1000

  doMove: -> undefined

  onClick: ->
    @props.onNodeClicked? @props.image

  render: ->
    defaultImage = "img/nodes/blank.png"
    imageUrl = if @props.image?.length > 0 then @props.image else defaultImage
    (div {className: 'proto-node', ref: 'node', onClick: @onClick, 'data-node-key': @props.key, 'data-image': @props.image, 'data-title': @props.title},
      (div {className: 'img-background'},
        (img {src: imageUrl})
      )
    )
