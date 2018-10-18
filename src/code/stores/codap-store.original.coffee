CodapConnect = require '../models/codap-connect'
CodapActions = require '../actions/codap-actions'

codapStore   = Reflux.createStore
  listenables: [CodapActions]

  init: ->
    codapConnect = CodapConnect.instance 'building-models'
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
    @unsubscribe = codapStore.listen @onCodapStateChange

  componentWillUnmount: ->
    @unsubscribe()

  onCodapStateChange: (status) ->
    @setState
      codapHasLoaded: status.codapHasLoaded
      hideUndoRedo:   status.hideUndoRedo

module.exports =
  actions: CodapActions
  store: codapStore
  mixin: mixin
