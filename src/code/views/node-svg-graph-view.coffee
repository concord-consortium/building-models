{svg, path, line, text, div, tspan, image} = React.DOM

SimulationStore = require '../stores/simulation-store'
SquareImage = React.createFactory require "./square-image-view"

module.exports = NodeSvgGraphView = React.createClass
  displayName: 'NodeSvgGraphView'
  mixins: [ SimulationStore.mixin ]

  getDefaultProps: ->
    width: 48
    height: 48
    strokeWidth: 3
    min: 0
    max: 100
    data: []
    color: '#aaa'

  invertPoint: (point) ->
    {x: @props.width - point.x, y: @props.height - point.y}

  graphMapPoint: (point) ->
    x = point.x * @props.width
    y = (@props.strokeWidth-1) + point.y * (@props.height - (@props.strokeWidth+1))
    @invertPoint x:x, y:y

  pointsToPath: (points)->
    return "" unless points.length
    data = _.map points, (p) => @graphMapPoint(p)
    data = _.map data,   (p) -> "#{p.x} #{p.y}"
    data = data.join " L "
    "M #{data}"

  getPathPoints: ->
    max  = @props.max
    min  = @props.min
    data = @props.data

    rangex = @state.duration - 1
    data = _.takeRight(data, rangex).reverse()

    for point in data
      if point > max then max = point
      if point < min then min = point
    rangey = max - min

    data = _.map data, (d, i) ->
      x = i / rangex
      y = d / rangey
      {x: x, y: y}
    data

  renderImage: ->
    imageOffset = 2
    imageStyle =
      position: "absolute"
      top: imageOffset
      left: imageOffset
      opacity: 0.25
      width: @props.width + imageOffset
      height: @props.height + imageOffset

    (div {style: imageStyle}, @props.image)

  renderSVG: ->
    svgOffset = 3
    svgStyle =
      position: "absolute"
      top: svgOffset
      left: svgOffset
    (svg {style: svgStyle, width: @props.width, height: @props.height},
      (path {d: @pointsToPath(@getPathPoints()), strokeWidth: @props.strokeWidth, stroke: @props.color, fill: "none"})
    )

  render: ->
    (div {},
      @renderImage()
      @renderSVG()
    )
