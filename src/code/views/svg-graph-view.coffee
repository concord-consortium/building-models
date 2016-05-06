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
    customData: null

  drawing: false
  
  getInitialState: ->
    currentData: null
    pointPathData: null

  componentWillReceiveProps: (newProps) ->
    if newProps.formula
      @setState
        currentData: null
        pointPathData: null
        
      currentData = newProps.actualData
      @updatePointData newProps.formula, currentData
        
  updatePointData: (formula, currentData) ->
    if not currentData?
      currentData = @loadCustomDataFromFormula formula
    pointPathData = @getPathPoints(currentData)
    @setState {currentData, pointPathData}
    
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
    
  findClosestPoint:(path, pointX, pointY) ->
    graphOrigin = @graphMapPoint {x:0, y:0}
    x = pointX - $(path).offset().left
    y = pointX - $(path).offset().top
    p = {x: x, y: y}
    p
    
  pointsToPath: (points)->
    data = _.map points, (p) => @graphMapPoint(p)
    data = _.map data,   (p) -> "#{p.x} #{p.y}"
    data = data.join " L "
    "M #{data}"

  loadCustomDataFromFormula: (formula) ->
    rangex = 100
    data = _.range(0,rangex)
    miny = Infinity
    maxy = -Infinity

    data = _.map data, (x) ->
      scope = {in: x, out: 0, maxIn: rangex, maxOut: rangex}
      try
        y = math.eval formula, scope
        if y < miny then miny = y
        if y > maxy then maxy = y
      catch error
        console.log "Error: #{error}"
      [x,y]

  getPathPoints: (currentData) ->
    rangex = 100
    data = _.range(0,rangex)
    miny = Infinity
    maxy = -Infinity
    if currentData?
      data = _.map currentData, (point) ->
        x = _.first point
        y = _.last point
        if y < miny then miny = y
        if y > maxy then maxy = y
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
    #data = @pointsToPath(@getPathPoints())
    data = @pointsToPath(@state.pointPathData)
    (path {className: 'data', d:data, strokeWidth:@props.strokeWidth})
    
  startDrawCurve: (evt) ->
    if (@props.customData)
      @drawing = true
      @drawCurve(evt)
    
  drawCurve: (evt) ->
    if @drawing
      evt.preventDefault()
      rect = evt.target.getBoundingClientRect()
      coords = {x: rect.width - (rect.right-evt.clientX), y: rect.bottom - evt.clientY}
      scaledCoords = {x: Math.round(coords.x / rect.width * 100), y: Math.round(coords.y / rect.height * 100)}
      
      if scaledCoords.x >= 0 && scaledCoords.x <= 100 && scaledCoords.y >= 0 && scaledCoords.y <= 100
        newData = _.map @state.currentData, (d) ->
          x = d[0]
          y = d[1]
          if x > scaledCoords.x - 3 && x < scaledCoords.x + 3
            y = scaledCoords.y
          [x, y]
        @updatePointData @props.formula, newData

  endDrawCurve: (evt) ->
    @drawing = false
    
  render: ->
    (div {className: 'svgGraphView' },
      (svg {width: @props.width, height: @props.height },
        @renderAxisLines()
        if @props.formula then @renderLineData()
        @renderXLabel()
        @renderYLabel()
      )
      if not @props.formula
        (div {className: 'unknown-graph'},
          "?"
        )
      (div {className: 'draw-graph drawing', onMouseDown: @startDrawCurve, onMouseMove: @drawCurve, onMouseUp: @endDrawCurve, onMouseOut: @endDrawCurve})
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
