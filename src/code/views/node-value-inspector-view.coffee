{div, h2, label, span, input, p, i} = React.DOM

SimulationStore = require '../stores/simulation-store'
tr = require "../utils/translate"

module.exports = React.createClass

  displayName: 'NodeValueInspectorView'

  mixins: [ SimulationStore.mixin ]

  propTypes:
    max: React.PropTypes.number
    min: React.PropTypes.number
    onChange: React.PropTypes.func

  getInitialState: ->
    'editing-min': false
    'editing-max': false
    'min-value': @props.node.min
    'max-value': @props.node.max

  componentWillReceiveProps: ->
    # min and max are copied to state to disconnect the state and property, so
    # that we can set the text field and only update the model when the input field
    # is blured. This way we don't perform min/max validation while user is typing
    @setState
      'min-value': @props.node.min
      'max-value': @props.node.max

  trim: (inputValue) ->
    return Math.max(@props.node.min, Math.min(@props.node.max, inputValue))

  updateValue:  (evt) ->
    if @state.modelIsRunning and not @props.node.canEditValueWhileRunning()
      # don't do anything; effectively disables slider
      return

    if value = evt.target.value
      value = @trim(parseInt(value))
      @props.graphStore.changeNode(initialValue:value)

  updateChecked:  (evt) ->
    value = evt.target.checked
    @props.graphStore.changeNode(isAccumulator:value)
    SimulationStore.actions.toggledCollectorTo value

  updateDefiningType: ->
    @props.graphStore.changeNode(valueDefinedSemiQuantitatively: not @props.node.valueDefinedSemiQuantitatively)

  selectText: (evt) ->
    evt.target.select()

  renderEditableProperty: (property, classNames) ->
    swapState = =>
      # first copy state value to model if we were editing
      if @state["editing-#{property}"]
        @props.graphStore.changeNodeProperty property, @state["#{property}-value"]
      @setState "editing-#{property}": not @state["editing-#{property}"], ->
        this.refs.focusable?.focus()

    updateProperty = (evt) =>
      # just update internal state while typing
      value = parseInt(evt.target.value)
      if value? then @setState "#{property}-value": value

    keyDown = (evt) ->
      if evt.key is 'Enter'
        swapState()

    if not @state["editing-#{property}"]
      (div {className: "half small editable-prop #{classNames}", onClick: swapState}, @state["#{property}-value"])
    else
      (input {
        className: "half small editable-prop #{classNames}"
        type: 'number'
        value: @state["#{property}-value"]
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
        (div {className: 'full'},
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
        )
        if not node.isTransfer
          (span {className: "checkbox group full"},
            (label {}, [
              input {type: "checkbox", checked: node.isAccumulator, onChange: @updateChecked}
              tr "~NODE-VALUE-EDIT.IS_ACCUMULATOR"
            ])
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
