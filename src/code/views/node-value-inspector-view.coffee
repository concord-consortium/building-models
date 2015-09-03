{div, h2, label, span, input, p, i} = React.DOM

tr = require "../utils/translate"

module.exports = React.createClass

  displayName: 'NodeValueInspectorView'

  propTypes:
    max: React.PropTypes.number
    min: React.PropTypes.number
    onChange: React.PropTypes.func

  getDefaultProps: ->
    max: 100
    min: 0

  trim: (inputValue) ->
    return Math.max(@props.min, Math.min(@props.max, inputValue))

  updateValue:  (evt) ->
    if value = evt.target.value
      value = @trim(parseInt(value))
      @props.graphStore.changeNode(initialValue:value)

  updateChecked:  (evt) ->
    value = evt.target.checked
    @props.graphStore.changeNode(isAccumulator:value)

  updateDefiningType: ->
    @props.graphStore.changeNode(valueDefinedSemiQuantitatively: not @props.node.valueDefinedSemiQuantitatively)

  selectText: (evt) ->
    evt.target.select()

  render: ->
    node = @props.node
    (div {className: 'value-inspector'},
      (div {className: 'inspector-content group'},
        unless node.valueDefinedSemiQuantitatively
          (span {className: 'full'},
            (label {className: 'right'}, tr "~NODE-VALUE-EDIT.INITIAL-VALUE")
            (input {
              className: 'left'
              type: "number",
              min: "#{@props.min}",
              max: "#{@props.max}",
              value: "#{node.initialValue}",
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
            value: "#{node.initialValue}",
            onChange: @updateValue}
          )
          (label {className: "left half small"}, if node.valueDefinedSemiQuantitatively then tr "~NODE-VALUE-EDIT.LOW" else @props.min)
          (label {className: "right half small"}, if node.valueDefinedSemiQuantitatively then tr "~NODE-VALUE-EDIT.HIGH" else @props.max)
        )
        (span {className: "checkbox group full"},
          (span {},
            (input {type: "checkbox", checked: node.isAccumulator, onChange: @updateChecked})
            (label {}, tr "~NODE-VALUE-EDIT.IS_ACCUMULATOR")
          )
          (i {className: "fa fa-question-circle"})
        )
      )

      (div {className: "bottom-pane"},
        (p {},
          if node.valueDefinedSemiQuantitatively then tr "~NODE-VALUE-EDIT.DEFINING_WITH_WORDS"
          else  tr "~NODE-VALUE-EDIT.DEFINING_WITH_NUMBERS")
        (p {},
          (label {className: 'node-switch-edit-mode', onClick: @updateDefiningType},
            if node.valueDefinedSemiQuantitatively then tr "~NODE-VALUE-EDIT.SWITCH_TO_DEFINING_WITH_NUMBERS"
            else tr "~NODE-VALUE-EDIT.SWITCH_TO_DEFINING_WITH_WORDS"
          )
        )
      )
    )
