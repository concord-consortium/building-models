{div, i, label, span, input, svg, circle, path, rect} = React.DOM

SVGSlider = React.createFactory React.createClass
  displayName: 'SVGSlider'

  getDefaultProps: ->
    width:  72
    height: 20
    min: 0
    max: 100
    value: 50
    handleSize: 16
    onValueChange: (v) ->
      log.info "new value #{v}"

  getInitialState: ->
    value = _.clone @props.value
    value = if value > @props.max then @props.max else value
    value = if value < @props.min then @props.min else value
    value: value
    dragging: false

  updateValue: (xValue,dragging) ->
    value = @valueFromSliderUI(xValue)
    @setState
      'value': value
      'dragging': dragging
    @props.onValueChange value

  componentDidMount: ->
    handle   = @refs.handle or @
    $(handle.getDOMNode()).draggable
      axis: "x"
      containment: "parent"
      start: (event, ui) =>
        @updateValue ui.position.left, true

      drag: (event, ui) =>
        @updateValue ui.position.left, true

      stop: (event, ui) =>
        @updateValue ui.position.left, false

  valueFromSliderUI: (displayX) ->
    newV = (displayX / @props.width * (@props.max - @props.min)) + @props.min
    newV = if newV > @props.max then @props.max else newV
    newV = if newV < @props.min then @props.min else newV
    return newV

  sliderLocation: ->
    (@state.value - @props.min) / (@props.max - @props.min)

  sliderPercent: ->
    (@sliderLocation() * 100)

  renderNumber: ->
    style =
      bottom: "#{@props.handleSize}px"

    if @state.dragging
      style.display = "block"
    (div {className: "number", style: style}, Math.round(@state.value))

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
        (i {className: "ivy-icon-smallSliderLines"})
        @renderNumber()
      )
    )

  renderLegend: ->
    (div {className:"legend"},
      (div {className: "min"}, @props.min)
      (div {className: "max"}, @props.max)
    )

  render: ->
    center = @props.height / 2
    style =
      padding: "0px"
      border: "0px"
      width: "#{@props.width}px"
      "min-height":"#{@props.height}px"
    circleRadius = 2
    (div {className: "value-slider", style: style},
      (svg {className: "svg-background", width: "#{@props.width}px", height:"#{@props.height}px", viewBox: "0 0 #{@props.width} #{@props.height}"},
        (path {d:"M#{circleRadius} #{center} l #{@props.width - circleRadius} 0", className:"slider-line"})
        (circle {cx:circleRadius, cy:center, r:circleRadius, className:"slider-shape"})
        (circle {cx:@props.width - circleRadius, cy:center, r:circleRadius, className:"slider-shape"})
      )
      @renderHandle()
      @renderLegend()
    )

ValueSlider = React.createClass
  getDefaultProps: ->
    min: 0,
    max: 100

  displayName: 'ValueSlider'

  render: ->
    (div {className: 'ValueSlider'},
      (SVGSlider {})
      (label {}, "vlaue slider")
      (input  {type:"range", min:@props.min, max:@props.max} )
    )
module.exports = SVGSlider

window.testComponent = (domID) -> React.render SVGSlider({}), domID
