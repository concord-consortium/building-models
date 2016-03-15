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
    @showing         = false
    @deleted         = false
    @showReplacement = false
    @replacement     = null
    @_notifyChanges()

  onOpen: ->
    @showing         = true
    @paletteItem     = PaletteStore.store.selectedPaletteItem
    @options         = _.without PaletteStore.store.palette, @paletteItem
    @showReplacement = false
    @deleted         = false
    @replacement     = null

    _.each (require './nodes-store').store.nodes, (node) =>
      if node.paletteItemIs @paletteItem
        @showReplacement = true

    if @showReplacement
      @replacement = @options[0]
    @undoManger.startCommandBatch()
    @_notifyChanges()

  onClose: ->
    @close()

  onSelect: (replacement) ->
    if replacement
      @replacement = replacement
      @_notifyChanges()

  onCancel: ->
    @close()

  onDelete: (item) ->
    @deleted = true
    PaletteStore.actions.delete(item)
    @close()

  close: ->
    @showing = false
    @_notifyChanges()
    @undoManger.endCommandBatch()
    if @replacement and @deleted
      PaletteStore.actions.selectPaletteItem @replacement
    else if not @deleted
      @undoManger.undo(true)
      PaletteStore.actions.restoreSelection()



  _notifyChanges: ->
    data =
      showing:         @showing
      paletteItem:     @paletteItem
      options:         @options
      replacement:     @replacement
      deleted:         @deleted
      showReplacement: @showReplacement
    @trigger(data)


listenerMixin =
  actions: paletteDialogActions

  getInitialState: ->
    showing:         store.showing
    paletteItem:     store.paletteItem
    options:         store.options
    replacement:     store.replacement
    deleted:         store.deleted
    showReplacement: store.showReplacement

  componentDidMount: ->
    @unsubscribe = store.listen @onChange

  componentWillUnmount: ->
    @unsubscribe()

  onChange: (status) ->
    @setState
      showing:         status.showing
      paletteItem:     status.paletteItem
      options:         status.options
      replacement:     status.replacement
      deleted:         status.deleted
      showReplacement: status.showReplacement

module.exports =
  store: store
  actions: paletteDialogActions
  mixin: listenerMixin
