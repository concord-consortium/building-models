PaletteStore = require './palette-store'
UndoRedo     = require '../utils/undo-redo'

paletteDialogActions = Reflux.createActions([
    "open", "close", "delete", "cancel", "select"
])


store = Reflux.createStore
  listenables: [ paletteDialogActions ]

  init: ->
    @initValues()
    @undoManger = UndoRedo.instance debug:true

  initValues: ->
    @showing             = false
    @deleted             = false
    @paletteItemHasNodes = false
    @_notifyChanges()

  onOpen: ->
    @showing             = true
    @paletteItem         = PaletteStore.store.selectedPaletteItem
    @options             = _.without PaletteStore.store.palette, @paletteItem
    @paletteItemHasNodes = false
    @replacement         = @options[0]
    @deleted             = false
    @paletteItemHasNodes = false

    _.each (require './nodes-store').store.nodes, (node) =>
      if node.paletteItemIs @paletteItem
        @paletteItemHasNodes = true

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
    PaletteStore.actions.delete(item)
    @close()
    @undoManger.endCommandBatch()

  close: ->
    @showing = false
    if @replacement and @deleted
      PaletteStore.actions.selectPaletteItem @replacement
    else
      PaletteStore.actions.restoreSelection()
    @_notifyChanges()

  _notifyChanges: ->
    data =
      showing:             @showing
      paletteItem:         @paletteItem
      options:             @options
      replacement:         @replacement
      deleted:             @deleted
      paletteItemHasNodes: @paletteItemHasNodes
    @trigger(data)


listenerMixin =
  actions: paletteDialogActions

  getInitialState: ->
    showing:             store.showing
    paletteItem:         store.paletteItem
    options:             store.options
    replacement:         store.replacement
    deleted:             store.deleted
    paletteItemHasNodes: store.paletteItemHasNodes

  componentDidMount: ->
    store.listen @onChange

  onChange: (status) ->
    @setState
      showing:             status.showing
      paletteItem:         status.paletteItem
      options:             status.options
      replacement:         status.replacement
      deleted:             status.deleted
      paletteItemHasNodes: status.paletteItemHasNodes

module.exports =
  store: store
  actions: paletteDialogActions
  mixin: listenerMixin
