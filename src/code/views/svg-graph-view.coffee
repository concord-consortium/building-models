{svg, path, line, text, div, tspan} = React.DOM
math = require 'mathjs'  # For formula parsing...
module.exports = SvgGraphView = React.createClass
  displayName: 'SvgGraphView'
  getDefaultProps: ->
    formula: "in ^ 2 * -2 + 5"
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

  # TODO: This is a hack. We parse the formula.
  # We want to know because it informs how we scale the
  # graph axis
  isExponential: ->
    @props.formula.indexOf("^") > -1 or @props.formula.indexOf("sqrt")  > -1

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
    rangex = 20
    data = _.range(0,rangex)
    miny = Infinity
    maxy = -Infinity
    data = _.map data, (x) =>
      scope = {in: x, out: 0}
      try
        y = math.eval @props.formula, scope
        if y < miny then miny = y
        if y > maxy then maxy = y
      catch error
        console.log "Errror: #{error}"
      { y: y, x: x}

    rangey = maxy - miny

    # if we aren't doing exponential graphing, then keep
    # then use the range of x for axis scaling
    scaley = if @isExponential() then rangey else rangex
    data = _.map data, (d) ->
      {x,y} = d
      y = (y - miny)
      x = x / rangex
      y = y / scaley
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
    data = [ {x:0, y:@props.height}, {x:0, y:0}, {x:@props.width, y:0}]
    (path {className: 'axisLines', d: @pointsToPath(data)})

  renderLineData: ->
    data = @pointsToPath(@getPathPoints())
    (path {className: 'data', d:data, "stroke-width":@props.strokeWidth})

  render: ->
    (div {className: 'svgGraphView'},
      (svg {width: @props.width, height: @props.height},
        @renderLineData()
        @renderAxisLines()
        @renderXLabel()
        @renderYLabel()
      )
    )

# TO DEBUG THIS VIEW:
RelationFactory = require "../models/relation-factory"
myView = React.createFactory SvgGraphView
window.testComponent = (domID) ->
  React.render myView({
    width: 200
    height: 200
    yLabel: "this node"
    xLabel: "input a"
  }), domID
