{div, h2, label, span, input, p, i} = React.DOM

tr = require "../utils/translate"

module.exports = React.createClass

  displayName: 'NodeValueInspectorView'

  propTypes:
    max: React.PropTypes.number
    min: React.PropTypes.number
    onChange: React.PropTypes.func


  getInitialState: ->
    value: 50

  getDefaultProps: ->
    max: 100
    min: 0

  trim: (inputValue) ->
    return Math.max(@props.min, Math.min(@props.max, inputValue))

  updateValue:  (evt) ->
    if value = evt.target.value
      value = @trim(parseInt(value))
      @setState(value: value)

  selectText: (evt) ->
    evt.target.select()

  render: ->
    (div {className: 'value-inspector'},
      (div {className: 'inspector-content group'},
        (span {className: 'full'},
          (label {className: 'right'}, tr "~NODE-VALUE-EDIT.INITIAL-VALUE")
          (input {
            className: 'left'
            type: "number",
            min: "#{@props.min}",
            max: "#{@props.max}",
            value: "#{@state.value}",
            onClick: @selectText,
            onChange: @updateValue}
          )
        )
        (div {className: "slider group full"},
          (input {
            className: "full"
            type: "range",
            min: "#{@props.min}",
            max: "#{@props.max}",
            value: "#{@state.value}",
            onChange: @updateValue}
          )
          (label {className: "left half small"}, @props.min)
          (label {className: "right half small"}, @props.max)
        )
        (span {className: "checkbox group full"},
          (span {},
            (input {type: "checkbox"})
            (label {}, tr "~NODE-VALUE-EDIT.IS_ACCUMULATOR")
          )
          (i {className: "fa fa-question-circle"})
        )
      )
      (div {className: "bottom-pane"},
        (p {}, tr "~NODE-VALUE-EDIT.DEFINING_WITH_WORDS")
      )
    )
