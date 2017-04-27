{div} = React.DOM

module.exports = React.createClass

  displayName: "StackedImage"

  image: ->
    if @props.image?.length > 0 and @props.image isnt "#remote"
      "url(#{@props.image})"
    else
      "none"

  css: (index) ->
    position: "absolute"
    backgroundImage: @image()
    backgroundSize: "contain"
    backgroundPosition: "center"
    backgroundRepeat: "no-repeat"
    margin: 0
    padding: 0
    height: "50%"
    width: "50%"

  render: ->
    styles = @props.imageProps.map((imgProps) ->
      top: "#{imgProps.top}%"
      left: "#{imgProps.left}%"
      transform: "rotate(#{imgProps.rotation}deg)"
    )
    div { style: { position: "relative", width: "100%", height: "100%" } },
        @props.imageProps.map((imgProps, index) =>
          div { style: _.assign({}, @css(index), styles[index]), key: index }
        )
