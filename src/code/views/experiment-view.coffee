SimulationStore = require '../stores/simulation-store'
tr              = require '../utils/translate'

{div, span, i, input}  = React.DOM

module.exports = React.createClass

  displayName: 'ExperimentView'

  mixins: [ SimulationStore.mixin ]


  increment: ->
    SimulationStore.actions.createExperiment()

  renderLabel: ->
    experimentLabel = "Experiment #"
    (span {className: "experiment-label"}, experimentLabel)

  renderCounter: ->
    count = @state.experimentNumber || 211
    (div {className: "experiment-counter", onClick: @increment },
      (div {className: "count"}, count)
      (div {className: "increment"}, "+")
    )

  render: ->
    classes = ["experiment-panel"]
    if @props.disabled
      classes.push('disabled')
    (div {className: classes.join(" ") },
      @renderLabel()
      @renderCounter()
    )
