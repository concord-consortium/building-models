codapActions = Reflux.createActions(
  [
    "codapLoaded"
  ]
)

codapStore   = Reflux.createStore
  listenables: [codapActions]

  init: ->
    @codapHasLoaded = false

  onCodapLoaded: ->
    @codapHasLoaded = true
    @notifyChange()

  notifyChange: ->
    data =
      codapHasLoaded: @codapHasLoaded
    @trigger(data)

mixin =
  getInitialState: ->
    codapHasLoaded: codapStore.codapHasLoaded

  componentDidMount: ->
    codapStore.listen @onCodapStateChange

  onCodapStateChange: (status) ->
    @setState
      codapHasLoaded: status.codapHasLoaded

module.exports =
  actions: codapActions
  store: codapStore
  mixin: mixin
