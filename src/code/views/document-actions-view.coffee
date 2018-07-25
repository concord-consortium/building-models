{div, span, i, br} = React.DOM
AboutView        = React.createFactory require './about-view'
AppSettingsStore = require '../stores/app-settings-store'
CodapStore       = require '../stores/codap-store'
UndoRedoUIStore  = require '../stores/undo-redo-ui-store'
tr               = require '../utils/translate'

SimulationRunPanel = React.createFactory require './simulation-run-panel-view'

module.exports = React.createClass

  mixins: [ CodapStore.mixin, UndoRedoUIStore.mixin, AppSettingsStore.mixin ]

  displayName: 'DocumentActions'

  componentDidMount: ->
    deleteFunction = @props.graphStore.deleteSelected.bind @props.graphStore
    @props.graphStore.selectionManager.addSelectionListener (manager) =>
      selectedNodes     = manager.getNodeInspection() or []
      selectedLinks      = manager.getLinkInspection() or []

      @setState
        #selectedNodes: selectedNodes
        #selectedLinks: selectedLinks
        selectedItems: selectedNodes.concat selectedLinks

  undoClicked: ->
    @props.graphStore.undo()

  redoClicked: ->
    @props.graphStore.redo()

  deleteClicked: ->
    if @state.lockdown
      @props.graphStore.removeSelectedLinks()
      # if @state.selectedLinks && @state.selectedLinks.length
        # only allow deletion of links in lockdown mode
        # @props.graphStore.removeSelectedLinks()

    else #if @state.selectedItems && @state.selectedItems.length > 0
      @props.graphStore.deleteSelected()

    @props.graphStore.selectionManager.clearSelection()

  renderRunPanel: ->
    if not @props.diagramOnly
      (SimulationRunPanel {})

  render: ->
    buttonClass = (enabled) -> if not enabled then 'disabled' else ''
    (div {className: 'document-actions'},
      (div {className: "misc-actions"},
        @renderRunPanel()
      )

      unless @state.hideUndoRedo
        (div {className: 'misc-actions'},
          # lockdown mode only highlight delete button when we have a link selected
          # @state.lockdown && @state.selectedLinks && @state.selectedLinks.length > 0 && (i {className: "icon-codap-trash", onClick: @deleteClicked}
          # )
          @state.selectedItems && @state.selectedItems.length > 0 && (i {className: "icon-codap-trash", onClick: @deleteClicked})
          (i {className: "icon-codap-arrow-undo #{buttonClass @state.canUndo}", onClick: @undoClicked, disabled: not @state.canUndo})
          (i {className: "icon-codap-arrow-redo #{buttonClass @state.canRedo}", onClick: @redoClicked, disabled: not @state.canRedo})
        )

      (AboutView {})
    )
