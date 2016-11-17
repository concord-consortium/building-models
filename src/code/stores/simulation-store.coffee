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
    "simulationStarted"
    "simulationFramesCreated"
    "recordingFramesCreated"
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
    @settings.modelReadyToRun = true
    @settings.modelIsRunning = true
    SimulationActions.resetSimulation.trigger()
    @notifyChange()

  onCollapseSimulationPanel: ->
    @settings.simulationPanelExpanded = false
    @settings.modelReadyToRun = false
    @settings.modelIsRunning = false
    @notifyChange()

  onGraphChanged: (data)->
    @nodes = data.nodes
    @settings.modelIsRunnable = @_checkModelIsRunnable()
    @settings.graphHasCollector = @_checkForCollectors()

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


  onCapNodeValues: (cap) ->
    @settings.capNodeValues = cap
    @notifyChange()

  onRunSimulation: ->
    @_runSimulation()

  stepUnits: ->
    if @settings.isRecordingPeriod
      @settings.stepUnits
    else
      TimeUnits.defaultUnit # "STEPS" when not specified or not running time interval

  _runSimulation: (duration=1)->
    if @settings.modelIsRunnable and @settings.modelReadyToRun
      # graph-store listens and will reset the simulation when
      # it is run to clear pre-saved data after first load
      @settings.modelIsRunning = true
      if @settings.graphHasCollector
        duration = @settings.duration
      @notifyChange()
      @currentSimulation = new Simulation
        nodes: @nodes
        duration: duration
        capNodeValues: @settings.capNodeValues

        # Simulation events get triggered as Actions here, and are
        # available to anyone who listens to this store
        onFrames: (frames) =>
          SimulationActions.simulationFramesCreated(frames)
          if @settings.isRecording
            if @settings.isRecordingPeriod
              SimulationActions.recordingFramesCreated(frames)
            else
              # Strip out the time information if we are simulating without time...
              framesNoTime = _.map frames, (f) ->
                # time: (removed)
                nodes: f.nodes
              SimulationActions.recordingFramesCreated(framesNoTime)

        onStart: (nodeNames) =>
          SimulationActions.simulationStarted(nodeNames)
          if @settings.isRecording
            SimulationActions.recordingDidStart(nodeNames)

        onEnd: ->
          SimulationActions.simulationEnded()

      @currentSimulation.run()


  onSimulationStarted: ->
    @notifyChange()

  onSimulationEnded: ->
    @settings.modelIsRunning = false
    @settings.modelReadyToRun = true
    @notifyChange()

  _startRecording: ->
    @settings.isRecording = true

  _stopRecording: ->
    @settings.isRecording = false
    @settings.isRecordingOne = false
    @settings.isRecordingStream = false
    @settings.isRecordingPeriod = false
    SimulationActions.recordingDidEnd()

  onStopRecording: ->
    @_stopRecording()
    @notifyChange()

  onRecordOne: ->
    @_startRecording()
    @settings.isRecordingOne = true
    @_runSimulation(1)
    stopRecording = ->
      SimulationActions.stopRecording()
    @timeout = setTimeout(stopRecording, 500)
    @notifyChange()

  onRecordStream: ->
    @_startRecording()
    @settings.isRecordingStream = true
    @notifyChange()

  onRecordPeriod: ->
    @_startRecording()
    @settings.isRecordingPeriod = true
    @_runSimulation(@settings.duration)
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
