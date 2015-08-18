PaletteStore = require './palette-store'

paletteDialogActions = Reflux.createActions([
    "open", "close", "delete", "cancel", "select"
  ])


store = Reflux.createStore
  listenables: [ paletteDialogActions ]

  init: ->
    @enableListening()
    @initValues()

  initValues: ->
    @showing      = false
    @paletteItem  = null
    @palette      = PaletteStore.store.palette
    @replacement  = null

    @_updateChanges()

  enableListening: ->
    PaletteStore.store.listen @onPaletteSelect

  onOpen: ->
    @showing = true
    @_updateChanges()

  onClose: ->
    @close()

  onSelect: (replacement) ->
    @replacement = replacement
    @_updateChanges()

  onCancel: ->
    @close()

  onDelete: (item) ->
    PaletteStore.actions.deleteSelected()
    @close()

  onPaletteSelect: (status) ->
    @paletteItem = status.selectedPaletteItem
    @palette     = status.palette
    if @showing
      @_updateChanges()

  close: ->
    @showing = false
    @_updateChanges()

  _updateChanges: ->
    data =
      showing     : @showing
      paletteItem : @paletteItem
      palette     : @palette
      replacement : @replacement
    @trigger(data)


listenerMixin =
  actions: paletteDialogActions

  getInitialState: ->
    showing     : store.showing
    paletteItem : store.paletteItem
    palette     : store.palette
    replacement : store.replacement

  componentDidMount: ->
    store.listen @onChange

  onChange: (status) ->
    @setState
      showing     : status.showing
      paletteItem : status.paletteItem
      palette     : status.palette
      replacement : status.replacement

module.exports =
  store: store
  actions: paletteDialogActions
  mixin: listenerMixin
