codapActions = Reflux.createActions(
  [
    "codapLoaded"
    "hideUndoRedo"
  ]
)

codapStore   = Reflux.createStore
  listenables: [codapActions]

  init: ->
    @codapHasLoaded = false
    @hideUndoRedo   = false

  onCodapLoaded: ->
    @codapHasLoaded = true
    @notifyChange()

  onHideUndoRedo: ->
    @hideUndoRedo = true
    @notifyChange()

  notifyChange: ->
    data =
      codapHasLoaded: @codapHasLoaded
      hideUndoRedo:   @hideUndoRedo
    @trigger(data)

mixin =
  getInitialState: ->
    codapHasLoaded: codapStore.codapHasLoaded
    hideUndoRedo:   codapStore.hideUndoRedo

  componentDidMount: ->
    codapStore.listen @onCodapStateChange

  onCodapStateChange: (status) ->
    @setState
      codapHasLoaded: status.codapHasLoaded
      hideUndoRedo:   status.hideUndoRedo

module.exports =
  actions: codapActions
  store: codapStore
  mixin: mixin
