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
    "recordPeriod"
    "stopRecording"
    "recordingDidStart"
    "recordingDidEnd"
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
      duration: 50
      stepUnits: defaultUnit
      stepUnitsName: unitName
      timeUnitOptions: options
      speed: 4
      capNodeValues: false
      modelIsRunning: false         # currently running?
      modelReadyToRun: true         # has been reset?
      # is the model valid?
      modelIsRunnable: @_checkModelIsRunnable()
      graphHasCollector: @_checkForCollectors()
      isRecording: false            # sending data to codap?
      isRecordingOne: false         # record-1 pressed?
      isRecordingStream: false      # record stream pressed?
      isRecordingPeriod: false      # record n units' pressed?

  # From AppSettingsStore actions
  onDiagramOnly: ->
    SimulationActions.collapseSimulationPanel()

  onExpandSimulationPanel: ->
    @settings.simulationPanelExpanded = true
    @notifyChange()

  onCollapseSimulationPanel: ->
    @settings.simulationPanelExpanded = false
    SimulationActions.simulationEnded()
    @notifyChange()

  onGraphChanged: (data)->
    @nodes = data.nodes
    @settings.modelIsRunnable = @_checkModelIsRunnable()
    @settings.graphHasCollector = @_checkForCollectors()
    if @settings.modelIsRunning
      @_runSimulation()
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
    @_runSimulation()

  _runSimulation: ->
    if @settings.modelIsRunnable and @settings.modelReadyToRun
      # graph-store listens and will reset the simulation when
      # it is run to clear pre-saved data after first load
      duration = 1
      if @settings.graphHasCollector
        duration = @settings.duration
      @notifyChange()
      @currentSimulation = new Simulation
        nodes: @nodes
        duration: duration
        speed: @settings.speed
        capNodeValues: @settings.capNodeValues

        # Simulation events get triggered as Actions here, and are
        # available to anyone who listens to this store
        onFrames: (frames) ->
          SimulationActions.simulationFramesCreated(frames)

        onStart: (nodeNames) ->
          SimulationActions.simulationStarted(nodeNames)
        onEnd: ->
          SimulationActions.simulationEnded()

      @currentSimulation.run()

    else if not @settings.modelIsRunnable
      error = @_getErrorMessage()
      alert error

  onSimulationStarted: ->
    @settings.modelIsRunning = true
    @settings.modelReadyToRun = true
    @notifyChange()

  onSimulationEnded: ->
    @currentSimulation = null
    @notifyChange()

  onResetSimulation: ->
    if @settings.modelIsRunning and @currentSimulation
      @currentSimulation.stop()
    @settings.modelReadyToRun = true
    @notifyChange()

  onStopRecording: ->
    @settings.isRecording = false
    @settings.isRecordingOne = false
    @settings.isRecordingStream = false
    @settings.isRecordingPeriod = false
    @notifyChange()

  onRecordOne: ->
    @settings.isRecording = true
    @settings.isRecordingOne = true
    stopRecording = ->
      SimulationActions.stopRecording()
    @timeout = setTimeout(stopRecording, 500)
    @notifyChange()

  onRecordStream: ->
    @settings.isRecording = true
    @settings.isRecordingStream = true
    @notifyChange()

  onRecordPeriod: ->
    @settings.isRecording = true
    @settings.isRecordingPeriod = true
    stopRecording = ->
      SimulationActions.stopRecording()
    @timeout = setTimeout(stopRecording, 500)
    @notifyChange()

  _checkModelIsRunnable: ->
    for node in @nodes
      for link in node.links
        if link.relation.isDefined then return true
    false

  _checkForCollectors: ->
    for node in @nodes
      if node.isAccumulator then return true
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
