AppSettingsActions = require('./app-settings-store').actions
ImportActions      = require '../actions/import-actions'
GraphActions       = require '../actions/graph-actions'
Simulation         = require "../models/simulation"
TimeUnits          = require '../utils/time-units'
tr                 = require '../utils/translate'

SimulationActions = Reflux.createActions(
  [
    "simulationPanelExpanded"
    "simulationPanelCollapsed"
    "runSimulation"
    "setDuration"
    "setStepUnits"
    "setSpeed"
    "simulationStarted"
    "simulationFramesCreated"
    "simulationEnded"
  ]
)

SimulationStore   = Reflux.createStore
  listenables: [
    SimulationActions, AppSettingsActions,
    ImportActions, GraphActions]

  init: ->
    defaultUnit = TimeUnits.defaultUnit
    unitName    = TimeUnits.toString defaultUnit
    options = ({name: TimeUnits.toString(unit, false), unit: unit} for unit in TimeUnits.units)

    @nodes = []
    @graphIsValid = true

    @settings =
      simulationPanelExpanded: false
      modelIsRunnable: true
      duration: 10
      stepUnits: defaultUnit
      stepUnitsName: unitName
      timeUnitOptions: options
      speed: 4

  # From AppSettingsStore actions
  onDiagramOnly: ->
    SimulationActions.collapseSimulationPanel()

  onSimulationPanelExpanded: ->
    @settings.simulationPanelExpanded = true
    @notifyChange()

  onSimulationPanelCollapsed: ->
    @settings.simulationPanelExpanded = false
    @notifyChange()

  onGraphChanged: (data)->
    @nodes = data.nodes

    simulator = new Simulation
      nodes: @nodes
    @graphIsValid = simulator.graphIsValid()
    @notifyChange()

  onSetDuration: (n) ->
    @settings.duration = Math.min n, 5000
    @notifyChange()

  onSetStepUnits: (unit) ->
    @settings.stepUnits = unit.unit
    @settings.stepUnitsName = TimeUnits.toString @settings.stepUnits, false
    @notifyChange()

  onImport: (data) ->
    _.merge @settings, data.settings.simulation
    @notifyChange()

  onSetSpeed: (s) ->
    @settings.speed = s
    @notifyChange()

  onRunSimulation: ->
    if @settings.modelIsRunnable
      simulator = new Simulation
        nodes: @nodes
        duration: @settings.duration
        speed: @settings.speed

        # Simulation events get triggered as Actions here, and are
        # available to anyone who listens to this store
        onStart: (nodeNames) ->
          SimulationActions.simulationStarted(nodeNames)
        onFrames: (frames) ->
          SimulationActions.simulationFramesCreated(frames)
        onEnd: ->
          SimulationActions.simulationEnded()

      simulator.run()
    else
      error = @_getErrorMessage()
      alert error

  _checkModelIsRunnable: ->
    @settings.modelIsRunnable = @graphIsValid and @settings.duration > 0

  _getErrorMessage: ->
    multipleErrors = not (@graphIsValid) and not (@settings.duration > 0)
    message = if multipleErrors
      "Your model could not be run due to the following reasons:"
    else ""
    bullet = if multipleErrors then "\n\n• " else ""

    if not (@graphIsValid)
      message += bullet + tr "~DOCUMENT.ACTIONS.GRAPH_INVALID"
    if not (@settings.duration > 0)
      message += bullet + tr "~DOCUMENT.ACTIONS.DURATION_INVALID"
    message

  notifyChange: ->
    @_checkModelIsRunnable()
    @trigger _.clone @settings

  importSettings: (data) ->
    _.merge @settings, data
    @notifyChange()

  serialize: ->
    duration: @settings.duration
    stepUnits:@settings.stepUnits


mixin =
  getInitialState: ->
    _.clone SimulationStore.settings

  componentDidMount: ->
    SimulationStore.listen @onSimulationStoreChange

  onSimulationStoreChange: (newData) ->
    @setState _.clone newData

module.exports =
  actions: SimulationActions
  store: SimulationStore
  mixin: mixin
