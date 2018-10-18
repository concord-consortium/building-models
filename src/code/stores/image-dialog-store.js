# TODO:  This should be split up into and ImageDialogStore and a DialogStore…

PaletteStore = require './palette-store'

imageDialogActions = Reflux.createActions([
    "open", "close", "update", "cancel"
  ])


store = Reflux.createStore
  listenables: [ imageDialogActions ]

  init: ->
    @enableListening()
    @initValues()

  initValues: ->
    @showingDialog    = false
    @keepShowing      = false
    @callback         = -> undefined

    @resetPaletteItem()
    @_updateChanges()

  resetPaletteItem: ->
    @paletteItem = null

  enableListening: ->
    PaletteStore.store.listen @onPaletteSelect

  onOpen: (callback=false)->
    @keepShowing = true
    @resetPaletteItem()
    @showingDialog = true

    @callback = null
    if callback
      @callback = callback
      @keepShowing = false
    @_updateChanges()

  onPaletteSelect: (status) ->
    @paletteItem = status.selectedPaletteItem
    @finish()  # Incase we need to trigger window closing

  close: ->
    @showingDialog = false
    @resetPaletteItem()

  onClose: ->
    @callback=null
    @close()
    @_updateChanges()

  onUpdate: (data) ->
    if @paletteItem
      @paletteItem = _.merge @paletteItem, data
    else
    @paletteItem ||= data
    @_updateChanges()

  onCancel: ->
    @resetPaletteItem()
    @finish()

  invoke_callback: ->
    @callback?(@paletteItem)
    @callback = null # once only

  finish: ->
    @_updateChanges()
    @invoke_callback()
    @callback = null
    @resetPaletteItem()
    @_updateChanges()
    unless @keepShowing
      imageDialogActions.close.trigger()

  _updateChanges: ->
    data =
      showingDialog: @showingDialog
      keepShowing: @keepShowing
      paletteItem: @paletteItem

    # log.info "Sending changes to listeners: #{JSON.stringify(data)}"
    @trigger(data)


listenerMixin =
  actions: imageDialogActions

  getInitialState: ->
    showingDialog: store.showingDialog
    keepShowing: store.keepShowing
    paletteItem: store.paletteItem
    selectedImage: store.paletteItem

  componentDidMount: ->
    @unsubscribe = store.listen @onChange

  componentWillUnmount: ->
    @unsubscribe()

  onChange: (status) ->
    @setState
      showingDialog: status.showingDialog
      keepShowing: status.keepShowing
      paletteItem: status.paletteItem
      selectedImage: status.paletteItem

module.exports =
  store: store
  actions: imageDialogActions
  mixin: listenerMixin
