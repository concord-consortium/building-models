{div, i, label, span, input, svg, circle, path, rect} = React.DOM
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
    onValueChange: (v) ->
      log.info "new value #{v}"
    onRangeChange: (r) ->
      log.info "new range #{r.min}, #{r.max}"

  getInitialState: ->
    dragging: false
    "editing-min": false
    "editing-max": false

  updateValue: (xValue,dragging) ->
    value = @valueFromSliderUI(xValue)
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
    opts =
      axis: "x"
      containment: "parent"
      start: (event, ui) =>
        @setState 'dragging': true
        @updateValue ui.position.left, true

      drag: (event, ui) =>
        @updateValue ui.position.left, true

      stop: (event, ui) =>
        @setState 'dragging': false
        @updateValue ui.position.left, false

    if (@props.snapToSteps)
      numTicks = ((@props.max - @props.min) / @props.stepSize)
      tickDistance = @props.width / numTicks
      opts.grid = [tickDistance, 0]

    $(handle.getDOMNode()).draggable opts


  valueFromSliderUI: (displayX) ->
    newV = (displayX / @props.width * (@props.max - @props.min)) + @props.min
    newV = if newV > @props.max then @props.max else newV
    newV = if newV < @props.min then @props.min else newV
    return Math.round(newV / @props.stepSize) * @props.stepSize

  sliderLocation: ->
    (@props.value - @props.min) / (@props.max - @props.min)

  sliderPercent: ->
    (@sliderLocation() * 100)

  renderNumber: ->
    style =
      bottom: "#{@props.handleSize}px"

    if @state.dragging and @props.renderValueTooltip
      style.display = "block"
    (div {className: "number", style: style}, @props.value.toFixed(@props.displayPrecision))

  renderHandle: ->
    width = height = "#{@props.handleSize}px"
    centerOfDiv = "#{@sliderPercent()}%"
    top = Math.round((@props.height - @props.handleSize)/ 2.0 )
    style =
      "width": width
      "height": height
      "margin-left": "-#{@props.handleSize/2}px"
      "margin-right": "-#{@props.handleSize/2}px"
      "font-size": "#{@props.handleSize / 2}px"
      "top": "#{top}px"
      "left": centerOfDiv # margin will take care of the rest?
    (div {},
      (div {className: "value-slider-handle", style: style, ref: "handle"},
        (i {className: "icon-codap-smallSliderLines"})
        @renderNumber()
      )
    )

  renderEditableProperty: (property) ->
    isEditable = @props["#{property}Editable"]

    swapState = =>
      # if not editable, ignore
      return if not isEditable
      # first copy state value to model if we were editing
      if @state["editing-#{property}"]
        newValue = parseInt React.findDOMNode(this.refs.focusable)?.value
        if newValue? then @updateRange property, newValue
      @setState "editing-#{property}": not @state["editing-#{property}"], ->
        React.findDOMNode(this.refs.focusable)?.focus()

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
    (div {className:"legend"},
      @props.minLabel or
        if @props.displaySemiQuant then tr "~NODE-VALUE-EDIT.LOW" else @renderEditableProperty "min"
      @props.maxLabel or
        if @props.displaySemiQuant then tr "~NODE-VALUE-EDIT.HIGH" else @renderEditableProperty "max"
    )

  renderTicks: (center, circleRadius) ->
    return unless @props.showTicks

    numTicks = ((@props.max - @props.min) / @props.stepSize)
    tickDistance = @props.width / numTicks
    tickHeight = circleRadius * 1.5
    ticks = []
    for j in [1...numTicks]
      ticks.push (path {d:"M#{j*tickDistance} #{center-tickHeight} l 0 #{tickHeight * 2}", className:"slider-line"})
    ticks

  render: ->
    center = @props.height / 2
    lengendHeight = 9 + 4.5
    style =
      padding: "0px"
      border: "0px"
      width: "#{@props.width}px"
      minHeight:"#{@props.height + lengendHeight}px"
    circleRadius = 2
    (div {className: "value-slider", style: style},
      (svg {className: "svg-background", width: "#{@props.width}px", height:"#{@props.height}px", viewBox: "0 0 #{@props.width} #{@props.height}"},
        (path {d:"M#{circleRadius} #{center} l #{@props.width - circleRadius} 0", className:"slider-line"})
        (circle {cx:circleRadius, cy:center, r:circleRadius, className:"slider-shape"})
        (circle {cx:@props.width - circleRadius, cy:center, r:circleRadius, className:"slider-shape"})
        @renderTicks(center, circleRadius)
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
    )

# window.testComponent = (domID) -> React.render React.createElement(Demo,{}), domID
