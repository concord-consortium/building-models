{div, img} = React.DOM
Draggable = require '../mixins/draggable'

module.exports = React.createClass

  displayName: 'ProtoNode'

  mixins: [Draggable]

  onClick: ->
    @props.onSelect @props.index

  removeClasses: ["palette-image"]

  render: ->
    className = "palette-image"
    defaultImage = "img/nodes/blank.png"
    imageUrl = if @props.image?.length > 0 then @props.image else defaultImage

    (div {
      'data-index': @props.index
      'data-title': @props.node.title
      'data-droptype': 'paletteItem'
      className: className
      ref: 'node'
      onClick: @onClick
      },
      (div { className: 'proto-node'},
        (div {className: 'img-background'},
          (img {src: imageUrl})
        )
      )
    )
