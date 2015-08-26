PaletteStore = require './palette-store'
UndoRedo       = require '../utils/undo-redo'

paletteDialogActions = Reflux.createActions([
    "open", "close", "delete", "cancel", "select"
  ])


store = Reflux.createStore
  listenables: [ paletteDialogActions ]

  init: ->
    @enableListening()
    @initValues()
    @undoManger = UndoRedo.instance debug:true

  initValues: ->
    @showing      = false
    @paletteItem  = PaletteStore.store.selectedPaletteItem
    @palette      = PaletteStore.store.palette
    @replacement  = null
    @deleted      = false
    @_notifyChanges()

  enableListening: ->
    PaletteStore.store.listen @onPaletteSelect

  onOpen: ->
    @showing      = true
    @_reset()
    @_notifyChanges()

  onClose: ->
    @close()

  onSelect: (replacement) ->
    @replacement = replacement
    @_notifyChanges()

  onCancel: ->
    @close()

  onDelete: (item) ->
    @deleted = true
    @undoManger.startCommandBatch()
    PaletteStore.actions.deleteSelected()
    @close()
    @undoManger.endCommandBatch()

  onPaletteSelect: (status) ->
    @paletteItem = status.selectedPaletteItem
    @palette     = status.palette
    @replacement = status.replacement
    @_reset()
    @_notifyChanges()

  close: ->
    @showing = false
    PaletteStore.actions.restoreSelection()
    @_notifyChanges()

  _reset: ->
    @deleted      = false
    @options      = _.without @palette, @paletteItem
    @replacement  = @options[0]

  _notifyChanges: ->
    data =
      showing     : @showing
      paletteItem : @paletteItem
      palette     : @palette
      options     : @options
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
