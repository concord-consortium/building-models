/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {};

const {div, span, i, br} = React.DOM;
const AboutView        = React.createFactory(require("./about-view"));
const AppSettingsStore = require("../stores/app-settings-store");
const CodapStore       = require("../stores/codap-store");
const UndoRedoUIStore  = require("../stores/undo-redo-ui-store");
const tr               = require("../utils/translate");

const SimulationRunPanel = React.createFactory(require("./simulation-run-panel-view"));

module.exports = React.createClass({

  mixins: [ CodapStore.mixin, UndoRedoUIStore.mixin, AppSettingsStore.mixin ],

  displayName: "DocumentActions",

  componentDidMount() {
    const deleteFunction = this.props.graphStore.deleteSelected.bind(this.props.graphStore);
    return this.props.graphStore.selectionManager.addSelectionListener(manager => {
      const selectedNodes     = manager.getNodeInspection() || [];
      const selectedLinks      = manager.getLinkInspection() || [];

      return this.setState({
        selectedNodes,
        selectedLinks,
        selectedItems: selectedNodes.concat(selectedLinks)
      });
    });
  },

  undoClicked() {
    return this.props.graphStore.undo();
  },

  redoClicked() {
    return this.props.graphStore.redo();
  },

  deleteClicked() {
    if (this.state.lockdown) {
      // Only allow deletion of links in lockdown mode
      this.props.graphStore.removeSelectedLinks();
    } else {
      this.props.graphStore.deleteSelected();
    }
    // Clear stored selections after delete
    return this.props.graphStore.selectionManager.clearSelection();
  },

  renderRunPanel() {
    if (!this.props.diagramOnly) {
      return (SimulationRunPanel({}));
    }
  },

  render() {
    const showDeleteUI = !this.state.uiElements.inspectorPanel && (this.state.touchDevice || this.props.graphStore.usingLara);
    const buttonClass = (enabled) => { if (!enabled) { return "disabled"; } else { return ""; } };
    return (div({className: "document-actions"},
      (div({className: "misc-actions"},
        this.renderRunPanel()
      )),
      !this.state.hideUndoRedo ?
        (div({className: "misc-actions"},
          // In Lockdown mode only show the Delete button when we have a link selected
          showDeleteUI && this.state.lockdown && this.state.selectedLinks && (this.state.selectedLinks.length > 0) && (i({className: "icon-codap-trash", onClick: this.deleteClicked})),
          // In normal operation, show the Delete button whenever we have a node or relationship selected
          showDeleteUI && !this.state.lockdown && this.state.selectedItems && (this.state.selectedItems.length > 0) && (i({className: "icon-codap-trash", onClick: this.deleteClicked})),
          (i({className: `icon-codap-arrow-undo ${buttonClass(this.state.canUndo)}`, onClick: this.undoClicked, disabled: !this.state.canUndo})),
          (i({className: `icon-codap-arrow-redo ${buttonClass(this.state.canRedo)}`, onClick: this.redoClicked, disabled: !this.state.canRedo}))
        )) : undefined,

      (AboutView({}))
    ));
  }
});
