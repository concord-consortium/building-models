AppSettingsActions = require('./app-settings-store').actions
ImportActions      = require '../actions/import-actions'
GraphActions       = require '../actions/graph-actions'
Simulation         = require "../models/simulation"
TimeUnits          = require '../utils/time-units'
tr                 = require '../utils/translate'

SimulationActions = Reflux.createActions(
  [
    "expandSimulationPanel"
    "collapseSimulationPanel"
    "runSimulation"
    "setPeriod"
    "setPeriodUnits"
    "setStepSize"
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
    unitNamePl  = TimeUnits.toString defaultUnit, true
    options = ({name: TimeUnits.toString(unit, true), unit: unit} for unit in TimeUnits.units)

    @nodes = []

    @settings =
      simulationPanelExpanded: false
      graphIsValid: true
      period: 10
      periodUnits: defaultUnit
      periodUnitsName: unitNamePl
      stepSize: 1
      stepUnits: defaultUnit
      stepUnitsName: unitName
      timeUnitOptions: options
      speed: 1

  # From AppSettingsStore actions
  onDiagramOnly: ->
    SimulationActions.collapseSimulationPanel()

  onExpandSimulationPanel: ->
    @settings.simulationPanelExpanded = true
    @notifyChange()

  onCollapseSimulationPanel: ->
    @settings.simulationPanelExpanded = false
    @notifyChange()

  onGraphChanged: (data)->
    @nodes = data.nodes

    simulator = new Simulation
      nodes: @nodes
    @settings.graphIsValid = simulator.graphIsValid()
    @notifyChange()

  onSetPeriod: (n) ->
    @settings.period = n
    @notifyChange()

  onSetPeriodUnits: (unit) ->
    @settings.periodUnits = unit.unit
    @notifyChange()

  onSetStepSize: (n) ->
    @settings.stepSize = n
    @notifyChange()

  onSetStepUnits: (unit) ->
    @settings.stepUnits = unit.unit
    @notifyChange()

  onImport: (data) ->
    _.merge @settings, data.settings.simulation
    @notifyChange()

  _setUnitsNames: ->
    pluralize = @settings.stepSize isnt 1
    @settings.stepUnitsName = TimeUnits.toString @settings.stepUnits, pluralize
    pluralize = @settings.period isnt 1
    @settings.periodUnitsName = TimeUnits.toString @settings.periodUnits, pluralize

  onSetSpeed: (s) ->
    @settings.speed = s
    @notifyChange()

  onRunSimulation: ->
    if @settings.graphIsValid
      steps = TimeUnits.stepsInTime @settings.stepSize, @settings.stepUnits, @settings.period, @settings.periodUnits
      steps = Math.min steps, 5000
      simulator = new Simulation
        nodes: @nodes
        duration: steps
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
      alert tr "~DOCUMENT.ACTIONS.GRAPH_INVALID"

  notifyChange: ->
    @_setUnitsNames()
    @trigger _.clone @settings

  importSettings: (data) ->
    _.merge @settings, data
    @notifyChange()

  serialize: ->
    period: @settings.period
    periodUnits: @settings.periodUnits
    stepSize: @settings.stepSize
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
