{svg, path, line, text, div, tspan} = React.DOM

SimulationStore = require '../stores/simulation-store'

module.exports = NodeSvgGraphView = React.createClass
  displayName: 'NodeSvgGraphView'
  mixins: [ SimulationStore.mixin ]

  getDefaultProps: ->
    width: 46
    height: 46
    strokeWidth: 3
    min: 0
    max: 100
    data: []

  invertPoint: (point) ->
    {x: point.x, y: @props.height - point.y}

  graphMapPoint: (point) ->
    x = point.x * (@props.width + 1)
    y = point.y * (@props.height + 1)
    @invertPoint x:x, y:y

  pointsToPath: (points)->
    return "" unless points.length
    data = _.map points, (p) => @graphMapPoint(p)
    data = _.map data,   (p) -> "#{p.x} #{p.y}"
    data = data.join " L "
    "M #{data}"

  getPathPoints: ->
    max = @props.max
    min = @props.min

    data = @props.data

    for point in data
      if point > max then max = point
      if point < min then min = point

    rangex = @state.duration - 1
    rangey = max - min

    data = _.map data, (d, i) ->
      x = i / rangex
      y = d / rangey
      {x: x, y: y}
    data

  renderLineData: ->
    data = @pointsToPath(@getPathPoints())
    (path {d: data, strokeWidth: @props.strokeWidth, stroke: "#a1d083", fill: "none"})

  render: ->
    (div {},
      (svg {width: @props.width, height: @props.height},
        @renderLineData()
      )
    )
