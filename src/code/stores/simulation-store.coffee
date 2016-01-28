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
    "resetSimulation"
    "setDuration"
    "setStepUnits"
    "setSpeed"
    "setNewIntegration"
    "simulationStarted"
    "simulationFramesCreated"
    "simulationEnded"
    "capNodeValues"
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
    @currentSimulation = null

    @settings =
      simulationPanelExpanded: false
      duration: 10
      stepUnits: defaultUnit
      stepUnitsName: unitName
      timeUnitOptions: options
      speed: 4
      capNodeValues: false
      modelIsRunning: false         # currently running?
      modelReadyToRun: true         # has been reset?
      newIntegration: false

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
    @notifyChange()

  onSetDuration: (n) ->
    @settings.duration = Math.max 1, Math.min n, 5000
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
    if @currentSimulation
      @currentSimulation.setSpeed s
    @notifyChange()

  onCapNodeValues: (cap) ->
    @settings.capNodeValues = cap
    @notifyChange()

  onSetNewIntegration: (newInt) ->
    @settings.newIntegration = newInt
    @notifyChange()

  onRunSimulation: ->
    if @settings.modelReadyToRun
      @currentSimulation = new Simulation
        nodes: @nodes
        duration: @settings.duration
        speed: @settings.speed
        capNodeValues: @settings.capNodeValues
        newIntegration: @settings.newIntegration


        # Simulation events get triggered as Actions here, and are
        # available to anyone who listens to this store
        onStart: (nodeNames) ->
          SimulationActions.simulationStarted(nodeNames)
        onFrames: (frames) ->
          SimulationActions.simulationFramesCreated(frames)
        onEnd: ->
          SimulationActions.simulationEnded()

      @currentSimulation.run()

  onSimulationStarted: ->
    @settings.modelIsRunning = true
    @settings.modelReadyToRun = false
    @notifyChange()

  onSimulationEnded: ->
    @settings.modelIsRunning = false
    @currentSimulation = null
    @notifyChange()

  onResetSimulation: ->
    if @settings.modelIsRunning and @currentSimulation
      @currentSimulation.stop()
    @settings.modelReadyToRun = true
    @notifyChange()

  notifyChange: ->
    @trigger _.clone @settings

  importSettings: (data) ->
    _.merge @settings, data
    @notifyChange()

  serialize: ->
    duration:       @settings.duration
    stepUnits:      @settings.stepUnits
    speed:          @settings.speed
    capNodeValues:  @settings.capNodeValues
    newIntegration: @settings.newIntegration

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
