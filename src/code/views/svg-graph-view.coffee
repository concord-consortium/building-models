{svg, path, line, text, div, tspan} = React.DOM
math = require 'mathjs'  # For formula parsing...
module.exports = SvgGraphView = React.createClass
  displayName: 'SvgGraphView'
  getDefaultProps: ->
    width: 200
    height: 200
    strokeWidth: 3
    fontSize: 16
    xLabel: "x axis"
    yLabel: "y axis"

  marginal: ->
    @props.fontSize * 0.4

  margin: ->
    @props.fontSize + @marginal()

  invertPoint: (point) ->
    {x: point.x, y: @props.height - point.y}

  graphMapPoint: (point) ->
    yOffset = @margin()
    xOffset = @margin()
    width   = @props.width  - (xOffset + @props.strokeWidth)
    height  = @props.height - (yOffset + @props.strokeWidth)
    x = point.x * width + xOffset
    y = point.y * height + yOffset
    @invertPoint x:x, y:y

  pointsToPath: (points)->
    data = _.map points, (p) => @graphMapPoint(p)
    data = _.map data,   (p) -> "#{p.x} #{p.y}"
    data = data.join " L "
    "M #{data}"

  getPathPoints: ->
    rangex = 100
    data = _.range(0,rangex)
    miny = Infinity
    maxy = -Infinity
    data = _.map data, (x) =>
      scope = {in: x, out: 0, maxIn: rangex, maxOut: rangex}
      try
        y = math.eval @props.formula, scope
        if y < miny then miny = y
        if y > maxy then maxy = y
      catch error
        console.log "Errror: #{error}"
      { y: y, x: x}

    data = _.map data, (d) ->
      {x,y} = d
      x = x / rangex
      y = y / rangex
      {x: x, y: y}
    data

  renderXLabel: ->
    y = @props.height - @props.fontSize + 2 * @marginal()
    (text {className: "xLabel", x:@margin(), y:y},
      @props.xLabel
    )

  renderYLabel: ->
    rotate = "rotate(-90 0, #{@props.height})"
    translate =  "translate(#{@props.fontSize})"
    transform = "#{rotate}"
    y = @props.height + @props.fontSize - 3
    (text {className: "yLabel", x:@margin(), y:y, transform:transform},
      @props.yLabel
    )

  renderAxisLines: ->
    data = [ {x:0, y:1}, {x:0, y:0}, {x:1, y:0}]
    (path {className: 'axisLines', d: @pointsToPath(data)})

  renderLineData: ->
    data = @pointsToPath(@getPathPoints())
    (path {className: 'data', d:data, strokeWidth:@props.strokeWidth})

  render: ->
    (div {className: 'svgGraphView'},
      (svg {width: @props.width, height: @props.height},
        @renderAxisLines()
        if @props.formula then @renderLineData()
        @renderXLabel()
        @renderYLabel()
      )
      if not @props.formula
        (div {className: 'unknown-graph'},
          "?"
        )
    )

# TO DEBUG THIS VIEW:
RelationFactory = require "../models/relation-factory"
myView = React.createFactory SvgGraphView
window.testComponent = (domID) ->
  ReactDOM.render myView({
    width: 200
    height: 200
    yLabel: "this node"
    xLabel: "input a"
  }), domID
