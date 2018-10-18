
InspectorPanelActions = Reflux.createActions(
  [
    "openInspectorPanel"
    "closeInspectorPanel"
  ]
)

InspectorPanelStore = Reflux.createStore
  listenables: [InspectorPanelActions]

  init: ->
    @settings =
      nowShowing: null
      selectedLink: null

  onOpenInspectorPanel: (nowShowing, options) ->
    @settings.nowShowing = nowShowing
    @settings.selectedLink = options.link if options?.link?
    @notifyChange()

  onCloseInspectorPanel: ->
    @settings.nowShowing = null
    @notifyChange()

  notifyChange: ->
    @trigger _.clone @settings

mixin =
  getInitialState: ->
    _.clone InspectorPanelStore.settings

  componentDidMount: ->
    @inspectorPanelUnsubscribe = InspectorPanelStore.listen @onInspectorPanelStoreChange

  componentWillUnmount: ->
    @inspectorPanelUnsubscribe()

  onInspectorPanelStoreChange: (newData) ->
    @setState _.clone newData

module.exports =
  actions: InspectorPanelActions
  store: InspectorPanelStore
  mixin: mixin
