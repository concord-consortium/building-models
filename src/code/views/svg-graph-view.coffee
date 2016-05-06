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
    link: null
    customData: null

  drawing: false
  
  getInitialState: ->
    currentData: null
    pointPathData: null

  componentWillMount: ->
    if not @state.pointPathData? and @props.customData?
      @updatePointData null, @props.customData
  
  componentWillReceiveProps: (newProps) ->
    if newProps.formula or newProps.customData
      @setState
        currentData: null
        pointPathData: null
        
      currentData = newProps.customData
      @updatePointData newProps.formula, currentData
      
    else
      @setState
        currentData: null
        pointPathData: null
        
      currentData = [[0,0],[1,0.0471612686578851],[2,0.0965467225771919],[3,0.148261257156578],[4,0.202414714794781],[5,0.259122118197412],[6,0.318503914686805],[7,0.380686232033823],[8,0.445801146355014],[9,0.513986962644141],[10,0.585388508533937],[11,0.66015744191203],[12,0.738452573044431],[13,0.820440201890771],[14,0.906294471327756],[15,0.996197737031086],[16,1.09034095480147],[17,1.18892408615744],[18,1.29215652305643],[19,1.40025753264622],[20,1.51345672299146],[21,1.63199453076443],[22,1.7561227319359],[23,1.88610497655083],[24,2.0222173487248],[25,2.16474895305053],[26,2.31400252866011],[27,2.47029509224716],[28,2.63395861141477],[29,2.80534070977934],[30,2.98480540532803],[31,3.1727338835981],[32,3.36952530732033],[33,3.57559766424629],[34,3.7913886549602],[35,4.01735662256112],[36,4.25398152619015],[37,4.50176596047037],[38,4.76123622302492],[39,5.03294343234054],[40,5.31746469835097],[41,5.61540434822661],[42,5.92739520997387],[43,6.25409995657079],[44,6.59621251349378],[45,6.95445953262505],[46,7.32960193567146],[47,7.7224365303729],[48,8.13379770293317],[49,8.56455919026798],[50,9.01563593583445],[51,9.4879860329839],[52,9.98261275996561],[53,10.5005667109039],[54,11.0429480272747],[55,11.610908734622],[56,12.2056551894756],[57,12.8284506416698],[58,13.4806179175039],[59,14.1635422294435],[60,14.8786741183315],[61,15.6275325343571],[62,16.4117080633277],[63,17.2328663050949],[64,18.0927514113128],[65,18.9931897900399],[66,19.9360939850561],[67,20.9234667381321],[68,21.9574052428813],[69,23.0401055992288],[70,24.173867477958],[71,25.3610990052439],[72,26.6043218775474],[73,27.9061767177331],[74,29.2694286837904],[75,30.6969733420674],[76,32.1918428174944],[77,33.7572122338606],[78,35.3964064578208],[79,37.1129071609597],[80,38.9103602149107],[81,40.7925834352391],[82,42.7635746905355],[83,44.8275203939453],[84,46.9888043951689],[85,49.2520172918201],[86,51.6219661799204],[87,54.1036848642377],[88,56.7024445501595],[89,59.4237650398063],[90,62.2734264561695],[91,65.2574815201738],[92,68.3822684067416],[93,71.6544242071655],[94,75.0808990263836],[95,78.6689707451003],[96,82.4262604781072],[97,86.3607487616379],[98,90.4807925041396],[99,94.7951427364635],[100,99.3129631991784]]
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
    if not @props.formula? and @state.pointPathData
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
    if @drawing
      @drawing = false
      #update relation with custom data
      console.log(@props)
      link = @props.link
      relation = link.relation
      relation.updateCustomData(@state.currentData)
      #relation.customData = @state.currentData
      @props.graphStore.changeLink(link, {relation: relation})
    
  render: ->
    (div {className: 'svgGraphView' },
      (svg {width: @props.width, height: @props.height },
        @renderAxisLines()
        if @state.pointPathData then @renderLineData()
        @renderXLabel()
        @renderYLabel()
      )
      if not (@props.formula or @props.customData or @state.pointPathData)
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
