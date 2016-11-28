SimulationStore = require '../stores/simulation-store'
tr              = require '../utils/translate'

{div, span, i, input}  = React.DOM

module.exports = React.createClass

  displayName: 'ExperimentView'

  mixins: [ SimulationStore.mixin ]


  increment: ->
    lastCount = @state.count || 1
    @setState
      count: lastCount + 1

  renderLabel: ->
    experimentLabel = "Experiment #"
    (span {className: "experiment-label"}, experimentLabel)

  renderCounter: ->
    count = @state.count || 211
    (div {className: "experiment-counter"},
      (div {className: "count"}, count)
      (div {className: "increment", onClick: @increment }, "+")
    )

  render: ->
    classes = ["experiment-panel","disabled"]
    if @props.disabled
      classes.append('disabled')
    (div {className: classes.join(" ") },
      @renderLabel()
      @renderCounter()
    )
