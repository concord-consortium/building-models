LaraConnect = require '../models/lara-connect'
LaraActions = require '../actions/lara-actions'

laraStore   = Reflux.createStore
  listenables: [LaraActions]

  init: ->
    laraConnect = LaraConnect.instance 'building-models'
    @laraHasLoaded = false

  onLaraLoaded: ->
    @laraHasLoaded = true
    @notifyChange()

  notifyChange: ->
    data =
      laraHasLoaded: @laraHasLoaded
    @trigger(data)

mixin =
  getInitialState: ->
    laraHasLoaded: laraStore.laraHasLoaded

  componentDidMount: ->
    @unsubscribe = laraStore.listen @onLaraStateChange

  componentWillUnmount: ->
    @unsubscribe()

  onLaraStateChange: (status) ->
    @setState
      laraHasLoaded: status.laraHasLoaded

module.exports =
  actions: LaraActions
  store: laraStore
  mixin: mixin
