{div} = React.DOM


module.exports = React.createClass

  displayName: "SquareImage"

  image: ->
    if @props.image?.length > 0 and @props.image isnt "#remote"
      "url(#{@props.image})"
    else
      "none"

  renderImage: ->
    (img {src: @props.image})

  css: ->
    "backgroundImage": @image()
    "backgroundSize": "contain"
    "backgroundPosition": "center"
    "backgroundRepeat": "no-repeat"
    "margin": "0px"
    "padding": "0px"
    "height": "100%"
    "width": "100%"

  render: ->
    (div {style: @css() })
