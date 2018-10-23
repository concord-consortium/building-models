const AppSettingsStore = require("../stores/app-settings-store");
const CodapStore       = require("../stores/codap-store");
const UndoRedoUIStore  = require("../stores/undo-redo-ui-store");
const tr               = require("../utils/translate");

import { AboutView } from "./about-view";
import { SimulationRunPanelView } from "./simulation-run-panel-view";

export const DocumentActionsView = React.createClass({

  mixins: [ CodapStore.mixin, UndoRedoUIStore.mixin, AppSettingsStore.mixin ],

  displayName: "DocumentActionsView",

  componentDidMount() {
    const deleteFunction = this.props.graphStore.deleteSelected.bind(this.props.graphStore);
    this.props.graphStore.selectionManager.addSelectionListener(manager => {
      const selectedNodes     = manager.getNodeInspection() || [];
      const selectedLinks      = manager.getLinkInspection() || [];

      this.setState({
        selectedNodes,
        selectedLinks,
        selectedItems: selectedNodes.concat(selectedLinks)
      });
    });
  },

  undoClicked() {
    this.props.graphStore.undo();
  },

  redoClicked() {
    this.props.graphStore.redo();
  },

  deleteClicked() {
    if (this.state.lockdown) {
      // Only allow deletion of links in lockdown mode
      this.props.graphStore.removeSelectedLinks();
    } else {
      this.props.graphStore.deleteSelected();
    }
    // Clear stored selections after delete
    this.props.graphStore.selectionManager.clearSelection();
  },

  renderRunPanel() {
    if (!this.props.diagramOnly) {
      return <SimulationRunPanelView />;
    }
  },

  render() {
    const showDeleteUI = !this.state.uiElements.inspectorPanel && (this.state.touchDevice || this.props.graphStore.usingLara);
    const buttonClass = (enabled) => { if (!enabled) { return "disabled"; } else { return ""; } };
    return (
      <div className="document-actions">
        <div className="misc-actions">
          {this.renderRunPanel()}
        </div>
        {!this.state.hideUndoRedo ?
          <div className="misc-actions">
            {showDeleteUI && this.state.lockdown && this.state.selectedLinks && (this.state.selectedLinks.length > 0) ? <i className="icon-codap-trash" onClick={this.deleteClicked} /> : undefined}
            {showDeleteUI && !this.state.lockdown && this.state.selectedItems && (this.state.selectedItems.length > 0) ? <i className="icon-codap-trash" onClick={this.deleteClicked} /> : undefined}
            <i className={`icon-codap-arrow-undo ${buttonClass(this.state.canUndo)}`} onClick={this.undoClicked} />
            <i className={`icon-codap-arrow-redo ${buttonClass(this.state.canRedo)}`} onClick={this.redoClicked} />
          </div> : undefined}
        <AboutView />
      </div>
    );
  }
});
