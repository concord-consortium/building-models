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
    "simulationStarted"
    "simulationFramesCreated"
    "simulationEnded"
    "capNodeValues"
    "recordStream"
    "recordOne"
    "stopRecording"
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
      modelIsRunnable: true         # is the model valid?
      isRecording: false            # sending data to codap?

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
    @settings.modelIsRunnable = @_checkModelIsRunnable()
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

  onRunSimulation: ->
    if @settings.modelIsRunnable and @settings.modelReadyToRun
      # graph-store listens and will reset the simulation when
      # it is run to clear pre-saved data after first load
      @notifyChange()
      @currentSimulation = new Simulation
        nodes: @nodes
        duration: @settings.duration
        speed: @settings.speed
        capNodeValues: @settings.capNodeValues


        # Simulation events get triggered as Actions here, and are
        # available to anyone who listens to this store
        onStart: (nodeNames) ->
          SimulationActions.simulationStarted(nodeNames)
        onFrames: (frames) ->
          SimulationActions.simulationFramesCreated(frames)
        onEnd: ->
          SimulationActions.simulationEnded()

      @currentSimulation.run()

    else if not @settings.modelIsRunnable
      error = @_getErrorMessage()
      alert error

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

  onStopRecording: ->
    console.log("stop recording")
    @settings.isRecording = false
    @notifyChange()

  onRecordOne: ->
    console.log("record one")
    @settings.isRecording = true
    stopRecording = ->
      SimulationActions.stopRecording()
    @timeout = setTimeout(stopRecording,0.5)
    @notifyChange()

  onRecordStream: ->
    console.log("recording stream")
    @settings.isRecording = true
    @notifyChange()

  _checkModelIsRunnable: ->
    for node in @nodes
      for link in node.links
        if link.relation.isDefined then return true
    false

  _getErrorMessage: ->
    # we just have the one error state right now
    tr "~DOCUMENT.ACTIONS.NO_DEFINED_LINKS"

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

mixin =
  getInitialState: ->
    _.clone SimulationStore.settings

  componentDidMount: ->
    @simulationUnsubscribe = SimulationStore.listen @onSimulationStoreChange

  componentWillUnmount: ->
    # this one named explicitly as we have views that mixin both simulationStore
    # and appSettingsStore
    @simulationUnsubscribe()

  onSimulationStoreChange: (newData) ->
    @setState _.clone newData

module.exports =
  actions: SimulationActions
  store: SimulationStore
  mixin: mixin
