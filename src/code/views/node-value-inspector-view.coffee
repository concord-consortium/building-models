{div, h2, label, span, input, p, i} = React.DOM

tr = require "../utils/translate"

module.exports = React.createClass

  displayName: 'NodeValueInspectorView'

  propTypes:
    max: React.PropTypes.number
    min: React.PropTypes.number
    onChange: React.PropTypes.func

  getInitialState: ->
    'editing-min': false
    'editing-max': false

  trim: (inputValue) ->
    return Math.max(@props.node.min, Math.min(@props.node.max, inputValue))

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

  renderEditableProperty: (property, classNames) ->
    swapState = =>
      @setState "editing-#{property}": not @state["editing-#{property}"], ->
        focusable = React.findDOMNode(this.refs.focusable)
        focusable.focus() unless not focusable

    updateProperty = (evt) =>
      value = parseInt(evt.target.value)
      if value
        @props.graphStore.changeNodeProperty property, value

    keyDown = (evt) ->
      if evt.key is 'Enter'
        swapState()

    if not @state["editing-#{property}"]
      (div {className: "half small editable-prop #{classNames}", onClick: swapState}, @props.node[property])
    else
      (input {
        className: "half small editable-prop #{classNames}"
        type: 'number'
        value: @props.node[property]
        onChange: updateProperty
        onBlur: swapState
        onKeyDown: keyDown
        ref: 'focusable'}
      )

  renderMinAndMax: (node) ->
    if node.valueDefinedSemiQuantitatively
      (div {className: "group full"},
        (label {className: "left half small"}, tr "~NODE-VALUE-EDIT.LOW")
        (label {className: "right half small"}, tr "~NODE-VALUE-EDIT.HIGH")
      )
    else
      (div {className: "group full"},
        @renderEditableProperty("min", "left")
        @renderEditableProperty("max", "right")
      )

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
              min: "#{node.min}",
              max: "#{node.max}",
              value: "#{node.initialValue}",
              onClick: @selectText,
              onChange: @updateValue}
            )
          )
        (div {className: "slider group full"},
          (input {
            className: "full"
            type: "range",
            min: "#{node.min}",
            max: "#{node.max}",
            value: "#{node.initialValue}",
            onChange: @updateValue}
          )
          @renderMinAndMax(node)
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
