{svg, path, line, text, div, tspan, span} = React.DOM

tr   = require "../utils/translate"
math = require 'mathjs'  # For formula parsing...
module.exports = SvgGraphView = React.createClass
  displayName: 'SvgGraphView'
  getDefaultProps: ->
    width: 200
    height: 200
    strokeWidth: 3
    strokeDasharray: "10,6"
    fontSize: 16
    xLabel: "x axis"
    yLabel: "y axis"
    link: null

  drawing: false

  getInitialState: ->
    currentData: null
    pointPathData: null
    # control state of the graph rendering
    canDraw: false
    definedRelationship: false
    # rendering style toggle for new custom relationships
    newCustomData: false

  componentWillMount: ->
    canDraw = false
    currentData = @props.link.relation.customData
    isDefined = @props.link.relation.isDefined
    formula = @props.link.relation.formula
    newCustomData = false

    if @props.link.relation.isCustomRelationship or (currentData? and isDefined)
      canDraw = true
      formula = null
      newCustomData = not currentData?

    @setState {
      currentData: currentData,
      canDraw: canDraw,
      newCustomData: newCustomData,
      definedRelationship: isDefined
    }

    if not @state.pointPathData? and isDefined
      if currentData?
        @updatePointData null, currentData
      else if formula?
        @updatePointData formula, null

  componentWillReceiveProps: (newProps) ->
    if newProps
      canDraw = false
      currentData = newProps.link.relation.customData
      isDefined = newProps.link.relation.isDefined
      formula = newProps.link.relation.formula

      if newProps.link.relation.isCustomRelationship or (currentData? and isDefined)
        canDraw = true
        if not isDefined
          newCustomData = true
          formula = "1 * 1"
        else
          formula = null

      else if formula?
        canDraw = false
        newCustomData = false
        currentData = null

      @setState {
        currentData: currentData,
        pointPathData: null,
        canDraw: canDraw,
        newCustomData: newCustomData,
        definedRelationship: isDefined
      }

      @updatePointData formula, currentData

  updatePointData: (formula, currentData) ->
    if not currentData? and formula?
      currentData = @loadCustomDataFromFormula formula
    else if currentData?
      @setState { definedRelationship: true }
    pointPathData = @getPathPoints(currentData)
    @setState {currentData: currentData, pointPathData: pointPathData}

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
    if @state.definedRelationship
      data = @pointsToPath(@state.pointPathData)
      if @state.newCustomData
        (path {className: 'data', d:data, strokeWidth:@props.strokeWidth, strokeDasharray:@props.strokeDasharray})
      else
        (path {className: 'data', d:data, strokeWidth:@props.strokeWidth})

  startDrawCurve: (evt) ->
    # can only draw on custom relationships
    if @state.canDraw
      document.addEventListener 'mousemove', @drawCurve
      document.addEventListener 'mouseup', @endDrawCurve
      @drawing = true
      if @state.newCustomData
        scaledCoords = @pointToScaledCoords(evt)
        starterFunction = '1 * ' + scaledCoords.y
        @updatePointData starterFunction, null
        newCustomData = false
        @setState {newCustomData: newCustomData}
      @drawCurve(evt)

  drawCurve: (evt) ->
    if @drawing and not @state.newCustomData
      evt.preventDefault()
      scaledCoords = @pointToScaledCoords(evt)

      x = Math.round scaledCoords.x
      y = scaledCoords.y

      # sanity check, but it shouldn't be possible to be out of bounds with our scaledCoords
      return if x < 0 || x > 100 || y < 0 || y > 100

      # our data is ordered in the format [[0, y], [1, y], [2, y], ...]
      # so we can set a new x, y simply using data[x] = [x, y]

      newData = _.clone @state.currentData

      currentTime = Date.now()
      if @_lastPoint && @_lastPoint.x != x && currentTime - @_lastPoint.time < 100
        # if our last point was < 100ms ago, this is probably the mouse moving across the canvas,
        # so interpolate all the points between that point and this point
        minX = Math.min x, @_lastPoint.x
        maxX = Math.max x, @_lastPoint.x
        minY = if x < @_lastPoint.x then y else @_lastPoint.y
        maxY = if x < @_lastPoint.x then @_lastPoint.y else y
        steps = maxX - minX
        yStep = (maxY - minY) / steps
        for i in [0..steps]
          interpolatedX = minX + i
          interpolatedY = minY + (yStep * i)
          newData[interpolatedX] = [interpolatedX, interpolatedY]
      else
        # otherwise, just set this point
        newData[x] = [x, y]

      @updatePointData @props.formula, newData

      @_lastPoint = {x: x, y: y, time: currentTime}

  endDrawCurve: (evt) ->
    if @drawing
      document.removeEventListener 'mousemove', @drawCurve
      document.removeEventListener 'mouseup', @endDrawCurve
      @drawing = false
      #update relation with custom data
      @updateRelationCustomData(@state.currentData)
    delete @_lastPoint

  pointToScaledCoords: (evt) ->
    rect = this.refs.graphBody?.getBoundingClientRect()
    coords = {x: rect.width - (rect.right-evt.clientX), y: rect.bottom - evt.clientY}
    coords.x = Math.max(0, Math.min(coords.x, rect.width))
    coords.y = Math.max(0, Math.min(coords.y, rect.height))
    scaledCoords = {x: Math.round(coords.x / rect.width * 100), y: Math.round(coords.y / rect.height * 100)}
    scaledCoords

  updateRelationCustomData: (customData) ->
    link = @props.link
    link.relation.customData = customData
    link.relation.isDefined = customData?
    @props.graphStore.changeLink(link, {relation: link.relation})

  render: ->
    drawClass = 'draw-graph'
    if @state.canDraw then drawClass += ' drawing'
    (div {className: 'svgGraphView' },
      (svg {width: @props.width, height: @props.height },
        @renderAxisLines()
        @renderLineData()
        @renderXLabel()
        @renderYLabel()
      )
      (div
        className: drawClass
        onMouseDown: @startDrawCurve
        ref: "graphBody"
        ,
        if @state.newCustomData
          (div {className: 'graph-hint'},
            (span {}, "#{tr "~NODE-RELATION-EDIT.CUSTOM_HINT"} ")
          )
        else unless @state.definedRelationship
          (div {className: 'unknown-graph'},
            "?"
          )
      )
    )

# TO DEBUG THIS VIEW:
# RelationFactory = require "../models/relation-factory"
# myView = React.createFactory SvgGraphView
# window.testComponent = (domID) ->
#   ReactDOM.render myView({
#     width: 200
#     height: 200
#     yLabel: "this node"
#     xLabel: "input a"
#   }), domID
