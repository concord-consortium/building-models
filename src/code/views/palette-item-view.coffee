{div, img} = React.DOM

module.exports = React.createClass

  displayName: 'ProtoNode'

  componentDidMount: ->
    # converts from a paletteItem to a element
    # in the diagram. (adding and removing css classes as required)
    reactSafeClone = (e) ->
      clone = $(@).clone(false)
      clone.removeClass "proto-node"
      clone.addClass "elm"
      clone.attr('data-reactid', null)
      clone.find("*").each (i,v) ->
        $(v).attr('data-reactid', null)
      clone
    $(@refs.node.getDOMNode()).draggable
      drag: @doMove
      revert: true
      helper: reactSafeClone
      revertDuration: 0
      opacity: 0.35
      appendTo: 'body'
      zIndex: 1000

  doMove: -> undefined

  onClick: ->
    @props.onSelect @props.index

  render: ->
    className = "palette-image"
    className = "#{className} selected" if @props.selected
    defaultImage = "img/nodes/blank.png"
    imageUrl = if @props.image?.length > 0 then @props.image else defaultImage

    (div {
      'data-index': @props.index
      'data-title': @props.node.title
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
