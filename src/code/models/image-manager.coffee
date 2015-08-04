PaletteManager = require './palette-manager'

actions = Reflux.createActions([
    "open", "close", "addImage", "cancel"
  ])


store = Reflux.createStore
  init: ->
    @enableListening()
    @initValues()

  initValues: ->
    @showing        = false
    @keepShowing    = false
    @lastImage      = null
    @callback       = -> undefined
    @_updateChanges()

  enableListening: ->
    @listenTo actions.open, @onOpen
    @listenTo actions.close, @onClose
    @listenTo actions.addImage, @onAddImage
    @listenTo actions.cancel, @onCancel

  onOpen: (callback=false)->
    PaletteManager.actions.deselect()
    @keepShowing = true
    @lastImage = null
    @callback = null
    if callback
      @callback = callback
      @keepShowing = false
    @showing = true
    @_updateChanges()

  onClose: ->
    @showing = false
    # When the window closes, select the newest added item
    # or whatever was selected when we started
    if @lastImage
      PaletteManager.actions.selectPaletteIndex 0
    else
      PaletteManager.actions.restoreSelection()
    @_updateChanges()

  onAddImage: (img) ->
    @lastImage = img
    @finish()

  onCancel: ->
    @lastImage = null
    @finish()

  finish: ->
    @_updateChanges()
    @callback?(@lastImage)
    unless @keepShowing
      actions.close.trigger()


  _updateChanges: ->
    data =
      showing: @showing
      keepShowing: @keepShowing
      lastImage: @lastImage

    log.info "Sending changes to listeners: #{JSON.stringify(data)}"
    @trigger(data)


listenerMixin =
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
  mixin: listenerMixin
