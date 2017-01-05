{div, i, label, span, input, svg, circle, path, rect, g} = React.DOM
tr = require "../utils/translate"

circleRadius = 2
constants = {
  orientation: {
    horizontal: {
      dimension: 'width',
      direction: 'left',
      coordinate: 'x'
    },
    vertical: {
      dimension: 'height',
      direction: 'top',
      coordinate: 'y'
    }
  }
}

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
    showLabels: true
    showHandle: true
    snapToSteps: false
    displayPrecision: 0
    renderValueTooltip: true
    minLabel: null
    maxLabel: null
    displaySemiQuant: false
    orientation: "horizontal"
    color: "gray"
    filled: false
    onValueChange: (v) ->
      log.info "new value #{v}"
    onRangeChange: (r) ->
      log.info "new range #{r.min}, #{r.max}"

  getInitialState: ->
    limit: 0
    grab: 0
    dragging: false
    "editing-min": false
    "editing-max": false

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
    window.addEventListener 'resize', @handleUpdate
    @handleUpdate()

  componentWillUnmount: ->
    window.removeEventListener 'resize', @handleUpdate

  handleUpdate: ->
    { orientation } = @props
    dimension = constants.orientation[orientation].dimension
    dimension = dimension.charAt(0).toUpperCase() + dimension.substr(1)
    sliderPos = @slider["offset#{dimension}"]
    handlePos = @handle?["offset#{dimension}"] or 0

    @setState
      limit: sliderPos - handlePos
      grab: handlePos / 2

  sliderLocation: ->
    @clamp (@props.value - @props.min) / (@props.max - @props.min), 0, 1

  sliderPercent: ->
    p = @sliderLocation() * 100
    if @props.orientation is 'horizontal'
      p
    else
      100 - p

  thickness: ->
    if @props.orientation is 'horizontal' then @props.height else @props.width
  length: ->
    if @props.orientation is 'horizontal' then @props.width else @props.height

  renderNumber: ->
    style =
      bottom: "#{@props.handleSize}px"

    if @state.dragging and @props.renderValueTooltip
      style.display = "block"
    (div {className: "number", style: style}, @props.value.toFixed(@props.displayPrecision))

  handleNoop: (e) ->
    e.stopPropagation()
    e.preventDefault()

  handleStart: (e) ->
    @handleNoop(e)
    @props.onSliderDragStart?()
    document.addEventListener 'mousemove', @handleDrag
    document.addEventListener 'mouseup',   @handleEnd

  handleEnd: ->
    @props.onSliderDragEnd?()
    document.removeEventListener 'mousemove', @handleDrag
    document.removeEventListener 'mouseup',   @handleEnd

  handleDrag: (e) ->
    @handleNoop(e)
    { onValueChange } = @props
    return unless onValueChange?

    value = @position(e)
    unless value is @props.value
      onValueChange(value)

  handleJumpAndDrag: (e) ->
    @handleDrag(e)
    @handleStart(e)

  clamp: (value, min, max) ->
    Math.min(Math.max(value, min), max)

  getValueFromPosition: (pos) ->
    { limit } = @state
    { orientation, min, max, stepSize } = @props
    percentage = (@clamp(pos, 0, limit) / (limit || 1))
    baseVal = stepSize * Math.round(percentage * (max - min) / stepSize)

    if orientation is 'horizontal'
      value = baseVal + min
    else
      value = max - baseVal

    @clamp value, min, max

  position: (e) ->
    { grab } = @state
    { orientation } = @props
    node = @slider
    coordinateStyle = constants.orientation[orientation].coordinate
    directionStyle = constants.orientation[orientation].direction
    clientCoordinateStyle = "client#{coordinateStyle.toUpperCase()}"
    coordinate = unless e.touches then e[clientCoordinateStyle] else e.touches[0][clientCoordinateStyle]
    direction = node.getBoundingClientRect()[directionStyle]

    pos = coordinate - direction - grab
    value = @getValueFromPosition(pos)

    return value

  renderHandle: ->
    { orientation, handleSize, displaySemiQuant } = @props
    width = height = "#{handleSize}px"
    centerOfDiv = "#{@sliderPercent()}%"
    outerEdge = Math.round((@thickness() - handleSize)/ 2.0 )
    style =
      "width": width
      "height": height
      "fontSize": "#{handleSize / 2}px"

    if orientation is 'horizontal'
      style.top  = "#{outerEdge}px"
      style.left = centerOfDiv # margin will take care of the rest?
      style.marginLeft = "-#{handleSize/2}px"
      style.marginRight = "-#{handleSize/2}px"
    else
      style.left  = "#{outerEdge}px"
      style.top = centerOfDiv
      style.marginTop = "-#{handleSize/2}px"
      style.marginBottom = "-#{handleSize/2}px"

    if not displaySemiQuant
      label = @renderNumber()
    else label = null

    classNames = "icon-codap-smallSliderLines"
    if orientation isnt 'horizontal' then classNames += " rotated"

    (div {
      className: "value-slider-handle"
      style: style
      ref: (s) => @handle = s
      onMouseDown: @handleStart
      onTouchEnd: @handleNoop
      onTouchMove: @handleDrag
      },

      (i {className: classNames})
      ( label )
    )

  renderEditableProperty: (property) ->
    isEditable = @props["#{property}Editable"]

    swapState = =>
      # if not editable, ignore
      return if not isEditable
      # first copy state value to model if we were editing
      if @state["editing-#{property}"]
        newValue = parseInt ReactDOM.findDOMNode(@refs.focusable)?.value
        if newValue? then @updateRange property, newValue
      @setState "editing-#{property}": not @state["editing-#{property}"], ->
        @refs.focusable?.focus()

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
    { minLabel, maxLabel, displaySemiQuant, orientation, width } = @props

    min = minLabel or
      if displaySemiQuant then tr "~NODE-VALUE-EDIT.LOW" else @renderEditableProperty "min"
    max = maxLabel or
      if displaySemiQuant then tr "~NODE-VALUE-EDIT.HIGH" else @renderEditableProperty "max"

    if orientation is 'horizontal'
      (div {className:"legend"},
        min, max
      )
    else
      (div {className:"legend", style: {left: width/1.7}},
        max, min
      )

  renderTicks: ->
    { showTicks, max, min, stepSize, orientation } = @props
    return unless showTicks

    center = @thickness() / 2
    numTicks = ((max - min) / stepSize)
    tickDistance = @length() / numTicks
    tickHeight = circleRadius * 1.5
    ticks = []
    for j in [1...numTicks]
      if orientation is 'horizontal'
        ticks.push (path {key: j, d:"M#{j*tickDistance} #{center-tickHeight} l 0 #{tickHeight * 2}", className:"slider-line"})
      else
        ticks.push (path {key: j, d:"M#{center-tickHeight} #{j*tickDistance} l #{tickHeight * 2} 0", className:"slider-line"})
    ticks

  renderLine: ->
    { filled, orientation, width, height, filled } = @props
    center = @thickness() / 2
    inset = circleRadius
    if filled then inset += 1
    if orientation is 'horizontal'
      (g {},
        (path {d:"M#{inset} #{center} l #{width - (inset*2)} 0", className:"slider-line", stroke:"#ccc"})
        if not filled
          (g {},
            (circle {cx:circleRadius, cy:center, r:circleRadius, className:"slider-shape", stroke:"#ccc"})
            (circle {cx:width - circleRadius, cy:center, r:circleRadius, className:"slider-shape"})
          )
        @renderTicks()
      )
    else
      (g {},
        (path {d:"M#{center} #{inset} l 0 #{height - (inset*2)}", className:"slider-line", stroke:"#ccc"})
        if not filled
          (g {},
            (circle {cx:center, cy:circleRadius, r:circleRadius, className:"slider-shape", stroke:"#ccc"})
            (circle {cx:center, cy:height - circleRadius, r:circleRadius, className:"slider-shape"})
          )
        @renderTicks()
      )

  renderFill: ->
    { orientation, color, width, height } = @props
    center = @thickness() / 2
    inset = circleRadius + 1
    if orientation is 'horizontal'
      (path
        d: "M#{inset} #{center} l #{width - (inset*2)} 0"
        className: "slider-line fill-line"
        stroke: color
      )
    else
      totalHeight = height - (inset * 2)
      top = inset + (totalHeight * (1 - @sliderLocation()))
      height = totalHeight-top
      if height > 0
        (g {},
          (path # flat top
            d: "M#{center} #{top} l 0 #{height}"
            className: "slider-line fill-line"
            stroke: color
          )
          (path # rounded bottom
            d: "M#{center} #{totalHeight} l 0 1"
            className: "slider-line fill-line cap"
            stroke: color
          )
        )

  render: ->
    { orientation, width, height, filled, showHandle, showLabels } = @props
    horizontal = orientation is 'horizontal'
    lengendHeight = 9 + 4.5
    style =
      padding: "0px"
      border: "0px"
      width: width + (if not horizontal and not filled then lengendHeight else 0)
      height: height + (if horizontal then lengendHeight else 0)
    classNames = "value-slider"
    if not horizontal then classNames += " vertical"
    if filled then classNames += " filled"
    (div {
      className: classNames
      style: style
      ref: (s) => @slider = s
      onMouseDown: @handleJumpAndDrag
      onTouchStart: @handleJumpAndDrag
      onTouchEnd: @handleNoop
      },
      (svg {className: "svg-background", width: "#{width}px", height:"#{height}px", viewBox: "0 0 #{width} #{height}"},
        @renderLine()
        if filled
          @renderFill()
      )
      if showHandle
        @renderHandle()
      if showLabels
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
    (div {style: {display: "flex"}},
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
          orientation: "vertical"
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
      (div {},
        Slider
          orientation: "vertical"
          filled: true
          showLabels: false
          showHandle: true
          renderValueTooltip: false
          height:  72
          width: 20
          value: @state.value
          min: @state.min
          max: @state.max
          stepSize: 1
          minEditable: true
          maxEditable: true
          onValueChange: @onValueChange
          onRangeChange: @onRangeChange
      )
      (div {},
        Slider
          orientation: "vertical"
          filled: true
          showLabels: false
          showHandle: false
          height:  72
          width: 20
          value: @state.value
          min: @state.min
          max: @state.max
          stepSize: 1
          minEditable: true
          maxEditable: true
          onValueChange: @onValueChange
          onRangeChange: @onRangeChange
      )
    )

window.testComponent = (domID) -> ReactDOM.render React.createElement(Demo,{}), domID
