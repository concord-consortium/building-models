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
    @paletteItem  = PaletteStore.store.selectedPaletteItem
    @palette      = PaletteStore.store.palette
    @replacement  = null
    @deleted      = false
    @_updateChanges()

  enableListening: ->
    PaletteStore.store.listen @onPaletteSelect

  onOpen: ->
    @showing      = true
    @deleted      = false
    @replacement  = PaletteStore.store.palette[0]
    @_updateChanges()

  onClose: ->
    @close()

  onSelect: (replacement) ->
    @replacement = replacement
    @_updateChanges()

  onCancel: ->
    @close()

  onDelete: (item) ->
    @deleted = true
    PaletteStore.actions.deleteSelected()
    @close()

  onPaletteSelect: (status) ->
    @paletteItem = status.selectedPaletteItem
    @palette     = status.palette
    @_updateChanges()

  close: ->
    @showing = false
    @_updateChanges()

  _updateChanges: ->
    data =
      showing     : @showing
      paletteItem : @paletteItem
      palette     : @palette
      options     : _.without @palette, @paletteItem
      replacement : @replacement
      deleted     : @deleted
    @trigger(data)


listenerMixin =
  actions: paletteDialogActions

  getInitialState: ->
    showing     : store.showing
    paletteItem : store.paletteItem
    palette     : store.palette
    options     : store.options
    replacement : store.replacement
    deleted     : store.deleted

  componentDidMount: ->
    store.listen @onChange

  onChange: (status) ->
    @setState
      showing     : status.showing
      paletteItem : status.paletteItem
      palette     : status.palette
      options     : status.options
      replacement : status.replacement
      deleted     : status.deleted

module.exports =
  store: store
  actions: paletteDialogActions
  mixin: listenerMixin
