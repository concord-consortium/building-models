
undoRedoUIActions = Reflux.createActions(
  [
    "setCanUndoRedo"
  ]
)

undoRedoUIStore = Reflux.createStore
  listenables: [undoRedoUIActions]

  init: (context) ->
    @canUndo = false
    @canRedo = false

  onSetCanUndoRedo: (canUndo, canRedo) ->
    @canUndo = canUndo
    @canRedo = canRedo
    @notifyChange()

  notifyChange: ->
    data =
      canUndo: @canUndo
      canRedo: @canRedo
    @trigger(data)

undoRedoUIMixin =
  getInitialState: ->
    canUndo: undoRedoUIStore.canUndo
    canRedo: undoRedoUIStore.canRedo

  componentDidMount: ->
    @unsubscribe = undoRedoUIStore.listen @onUndoRedoUIStateChange
    # can't add listener in init due to order-of-initialization issues
    GraphStore = require './graph-store'
    GraphStore?.store?.undoRedoManager?.addChangeListener @onUndoRedoUIStateChange

  componentWillUnmount: ->
    @unsubscribe()

  onUndoRedoUIStateChange: (state) ->
    @setState
      canUndo: state.canUndo
      canRedo: state.canRedo

module.exports =
  actions: undoRedoUIActions
  store: undoRedoUIStore
  mixin: undoRedoUIMixin
