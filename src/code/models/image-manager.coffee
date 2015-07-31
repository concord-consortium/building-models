actions = Reflux.createActions([
    "open", "close", "addImage"
  ])


store = Reflux.createStore
  init: ->
    @enableListening()
    @initValues()

  initValues: ->
    @showing        = true
    @keepShowing    = false
    @lastImage      = null
    @callback       = -> undefined
    @_updateChanges()

  enableListening: ->
    @listenTo actions.open, @onOpen
    @listenTo actions.close, @onClose
    @listenTo actions.addImage, @onAddImage

  onOpen: (callback=false)->
    @keepShowing = true
    @callback = false
    if callback
      @callback = callback
      @keepShowing = false
    @showing = true
    @_updateChanges()

  onClose: ->
    @callback?()
    @showing = false
    @_updateChanges()

  onImageAdd: (img) ->
    @lastImage = img
    @_updateChanges()

  _updateChanges: ->
    data =
      showing: @showing
      keepShowing: @keepShowing
      lastImage: @lastImage

    log.info "Sending changes to listeners: #{JSON.stringify(data)}"
    @trigger(data)


mixin =
  actions: actions

  getInitialState: ->
    showing: store.showing
    keepShowing: store.keepShowing
    lastImage: store.lastImage

  componentDidMount: ->
    store.listen @onChange

  onChange: (status) ->
    @setState
      showing: status.showing
      keepShowing: status.keepShowing
      lastImage: status.lastImage

module.exports =
  store: store
  actions: actions
  mixin: mixin
