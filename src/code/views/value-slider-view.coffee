{div, i, label, span, input, svg, circle, path, rect, g} = React.DOM
tr = require "../utils/translate"

ValueSlider = React.createClass
  displayName: 'SVGSlider'

  getDefaultProps: ->
    width:  72
    height: 20
    min: 0
    max: 100
    value: 50
    handleSize: 16
    minEditable: false
    maxEditable: false
    stepSize: 1
    showTicks: false
    snapToSteps: false
    displayPrecision: 0
    renderValueTooltip: true
    minLabel: null
    maxLabel: null
    displaySemiQuant: false
    enabled: true
    horizontal: true
    onValueChange: (v) ->
      log.info "new value #{v}"
    onRangeChange: (r) ->
      log.info "new range #{r.min}, #{r.max}"

  getInitialState: ->
    dragging: false
    "editing-min": false
    "editing-max": false

  updateValue: (locValue,dragging) ->
    console.log("locValue = "+locValue)
    value = @valueFromSliderUI(locValue)
    console.log("  value = "+value)
    @props.onValueChange value

  updateRange: (property, value) ->
    range =
      min: @props.min
      max: @props.max
    range[property] = value

    #normalize
    if property is "max"
      range.min = Math.min range.min, range.max
    else
      range.max = Math.max range.min, range.max
    if @props.value < range.min or @props.value > range.max
      value = Math.max range.min, Math.min range.max, @props.value
      @props.onValueChange value
    @props.onRangeChange range

  componentDidMount: ->
    handle   = @refs.handle or @
    loc = (ui) =>
      if @props.horizontal then ui.position.left else ui.position.top
    opts =
      axis: if @props.horizontal then "x" else "y"
      containment: "parent"
      start: (event, ui) =>
        @setState 'dragging': true
        @updateValue loc(ui), true

      drag: (event, ui) =>
        @updateValue loc(ui), true

      stop: (event, ui) =>
        @setState 'dragging': false
        @updateValue loc(ui), false

    if (@props.snapToSteps)
      numTicks = ((@props.max - @props.min) / @props.stepSize)
      tickDistance = @length() / numTicks
      opts.grid = if @props.horizontal then [tickDistance, 0] else [0, tickDistance]

    $(handle).draggable opts
    if not @props.enabled
      $(handle).draggable( "disable" )

  componentDidUpdate: ->
    handle = @refs.handle or @
    if @props.enabled
      $(handle).draggable( "enable" )
    else
      $(handle).draggable( "disable" )

  valueFromSliderUI: (displayPos) ->
    distance = if @props.horizontal then displayPos else @length() - displayPos
    newV = (distance / @length() * (@props.max - @props.min)) + @props.min
    newV = if newV > @props.max then @props.max else newV
    newV = if newV < @props.min then @props.min else newV
    return Math.round(newV / @props.stepSize) * @props.stepSize

  sliderLocation: ->
    (@props.value - @props.min) / (@props.max - @props.min)

  sliderPercent: ->
    p = @sliderLocation() * 100
    if @props.horizontal
      p
    else
      100 - p

  thickness: ->
    if @props.horizontal then @props.height else @props.width
  length: ->
    if @props.horizontal then @props.width else @props.height

  renderNumber: ->
    style =
      bottom: "#{@props.handleSize}px"

    if @state.dragging and @props.renderValueTooltip
      style.display = "block"
    (div {className: "number", style: style}, @props.value.toFixed(@props.displayPrecision))

  renderHandle: ->
    width = height = "#{@props.handleSize}px"
    centerOfDiv = "#{@sliderPercent()}%"
    outerEdge = Math.round((@thickness() - @props.handleSize)/ 2.0 )
    style =
      "width": width
      "height": height
      "fontSize": "#{@props.handleSize / 2}px"

    if @props.horizontal
      style.top  = "#{outerEdge}px"
      style.left = centerOfDiv # margin will take care of the rest?
      style.marginLeft = "-#{@props.handleSize/2}px"
      style.marginRight = "-#{@props.handleSize/2}px"
    else
      style.left  = "#{outerEdge}px"
      style.top = centerOfDiv
      style.marginTop = "-#{@props.handleSize/2}px"
      style.marginBottom = "-#{@props.handleSize/2}px"

    if not @props.displaySemiQuant
      label = @renderNumber()
    else label = null
    (div {className: "value-slider-handle", style: style, ref: "handle"},
      (i {className: "icon-codap-smallSliderLines"})
      ( label )
    )

  renderEditableProperty: (property) ->
    isEditable = @props["#{property}Editable"]

    swapState = =>
      # if not editable, ignore
      return if not isEditable
      # first copy state value to model if we were editing
      if @state["editing-#{property}"]
        newValue = parseInt ReactDOM.findDOMNode(this.refs.focusable)?.value
        if newValue? then @updateRange property, newValue
      @setState "editing-#{property}": not @state["editing-#{property}"], ->
        this.refs.focusable?.focus()

    keyDown = (evt) ->
      if evt.key is 'Enter'
        swapState()

    classNames = property
    if isEditable then classNames += " editable"

    if not @state["editing-#{property}"]
      (div {className: classNames, onClick: swapState}, @props[property])
    else
      (input {
        className: property
        type: 'number'
        defaultValue: @props[property]
        onBlur: swapState
        onKeyDown: keyDown
        ref: 'focusable'}
      )

  renderLegend: ->
    min = @props.minLabel or
      if @props.displaySemiQuant then tr "~NODE-VALUE-EDIT.LOW" else @renderEditableProperty "min"
    max = @props.maxLabel or
      if @props.displaySemiQuant then tr "~NODE-VALUE-EDIT.HIGH" else @renderEditableProperty "max"

    if @props.horizontal
      (div {className:"legend"},
        min, max
      )
    else
      (div {className:"legend", style: {left: @props.width/1.7}},
        max, min
      )

  renderTicks: (center, circleRadius) ->
    return unless @props.showTicks

    numTicks = ((@props.max - @props.min) / @props.stepSize)
    tickDistance = @length() / numTicks
    tickHeight = circleRadius * 1.5
    ticks = []
    for j in [1...numTicks]
      if @props.horizontal
        ticks.push (path {key: j, d:"M#{j*tickDistance} #{center-tickHeight} l 0 #{tickHeight * 2}", className:"slider-line"})
      else
        ticks.push (path {key: j, d:"M#{center-tickHeight} #{j*tickDistance} l #{tickHeight * 2} 0", className:"slider-line"})
    ticks

  renderLine: (center, circleRadius) ->
    if @props.horizontal
      (g {},
        (path {d:"M#{circleRadius} #{center} l #{@props.width - circleRadius} 0", className:"slider-line", stroke:"blue"})
        (circle {cx:circleRadius, cy:center, r:circleRadius, className:"slider-shape", stroke:"blue"})
        (circle {cx:@props.width - circleRadius, cy:center, r:circleRadius, className:"slider-shape"})
        @renderTicks(center, circleRadius)
      )
    else
      (g {},
        (path {d:"M#{center} #{circleRadius} l 0 #{@props.height - circleRadius}", className:"slider-line", stroke:"blue"})
        (circle {cx:center, cy:circleRadius, r:circleRadius, className:"slider-shape", stroke:"blue"})
        (circle {cx:center, cy:@props.height - circleRadius, r:circleRadius, className:"slider-shape"})
        @renderTicks(center, circleRadius)
      )

  render: ->
    center = @thickness() / 2
    lengendHeight = 9 + 4.5
    style =
      padding: "0px"
      border: "0px"
      width: @props.width + (if not @props.horizontal then lengendHeight else 0)
      height: @props.height + (if @props.horizontal then lengendHeight else 0)
    circleRadius = 2
    classNames = "value-slider"
    if not @props.horizontal then classNames += " vertical"
    if not @props.enabled then classNames += " disabled"
    (div {className: classNames, style: style},
      (svg {className: "svg-background", width: "#{@props.width}px", height:"#{@props.height}px", viewBox: "0 0 #{@props.width} #{@props.height}"},
        @renderLine(center, circleRadius)
      )
      @renderHandle()
      @renderLegend()
    )

module.exports = ValueSlider
Slider = React.createFactory ValueSlider
Demo = React.createClass
  getInitialState: ->
    value: 50
    min: 0
    max: 100
  onValueChange: (v) ->
    @setState({value: v})
  onRangeChange: (range) ->
    @setState
      min: range.min
      max: range.max
  render: ->
    (div {},
      Slider
        value: @state.value
        min: @state.min
        max: @state.max
        stepSize: 25
        showTicks: true
        snapToSteps: true
        minEditable: true
        maxEditable: true
        onValueChange: @onValueChange
        onRangeChange: @onRangeChange

      Slider
        horizontal: false
        height:  72
        width: 20
        value: @state.value
        min: @state.min
        max: @state.max
        stepSize: 25
        showTicks: true
        snapToSteps: true
        minEditable: true
        maxEditable: true
        onValueChange: @onValueChange
        onRangeChange: @onRangeChange
    )

window.testComponent = (domID) -> ReactDOM.render React.createElement(Demo,{}), domID
